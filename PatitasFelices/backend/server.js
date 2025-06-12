require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const authConfig = require('./config/auth.config');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const { sendPasswordRecoveryEmail, sendRecoveryEmail } = require('./utils/emailService');
const crypto = require('crypto');

const app = express();

const corsOptions = {
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UPLOADS_BASE_PATH = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(UPLOADS_BASE_PATH, 'mascotas');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'image/*');
  next();
}, express.static(UPLOADS_BASE_PATH));

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4'
});

connection.connect(error => {
  if (error) {
    console.error('Error connecting to database:', error);
    return;
  }
  console.log('Successfully connected to database');
  
  initializeDatabase();
});

// Update the initializeDatabase function
function initializeDatabase() {
  // Create default user first
  connection.query(`
    INSERT IGNORE INTO usuarios (id, nombre, apellido, correo, contraseña, rol)
    VALUES (1, 'Usuario', 'Default', 'default@example.com', 'password', 'dueño')
  `, (error) => {
    if (error) {
      console.error('Error creating default user:', error);
      return;
    }

    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`, (error) => {
      if (error) {
        console.error('Error creating database:', error);
        return;
      }

      connection.query(`USE ${process.env.DB_NAME}`, (error) => {
        if (error) {
          console.error('Error selecting database:', error);
          return;
        }

        connection.query(`
          CREATE TABLE IF NOT EXISTS mascotas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            raza VARCHAR(100),
            tamaño VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
            edad INT,
            notas TEXT,
            usuario_id INT,
            imagen_url VARCHAR(255) DEFAULT NULL
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `, (error) => {
          if (error) {
            console.error('Error creating mascotas table:', error);
            return;
          }

          // Create servicios table if not exists
          connection.query(`
            CREATE TABLE IF NOT EXISTS servicios (
              id INT AUTO_INCREMENT PRIMARY KEY,
              nombre VARCHAR(100) NOT NULL,
              duracion INT,
              precio DECIMAL(10,2),
              descripcion TEXT
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          `, (error) => {
            if (error) {
              console.error('Error creating servicios table:', error);
              return;
            }

            // Create paseos table if not exists
            connection.query(`
              CREATE TABLE IF NOT EXISTS paseos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                mascota_id INT,
                paseador_id INT,
                servicio_id INT,
                fecha DATETIME,
                estado VARCHAR(50),
                comprobante_xml TEXT
              ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
            `, (error) => {
              if (error) {
                console.error('Error creating paseos table:', error);
                return;
              }

              // Create usuarios table if not exists
              connection.query(`
                CREATE TABLE IF NOT EXISTS usuarios (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  nombre VARCHAR(100) NOT NULL,
                  apellido VARCHAR(100) NOT NULL,
                  correo VARCHAR(100) NOT NULL UNIQUE,
                  telefono VARCHAR(20),
                  direccion VARCHAR(200),
                  contraseña VARCHAR(255) NOT NULL,
                  rol VARCHAR(20) NOT NULL
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
              `, (error) => {
                if (error) {
                  console.error('Error creating usuarios table:', error);
                  return;
                }

                // Add test services if none exist
                connection.query('SELECT COUNT(*) as count FROM servicios', (error, results) => {
                  if (!error && results[0].count === 0) {
                    const testServices = [
                      {
                        nombre: 'Paseo Básico',
                        duracion: 30,
                        precio: 150.00,
                        descripcion: 'Paseo de 30 minutos'
                      },
                      {
                        nombre: 'Paseo Estándar',
                        duracion: 60,
                        precio: 250.00,
                        descripcion: 'Paseo de 1 hora'
                      }
                    ];
                    
                    testServices.forEach(service => {
                      connection.query('INSERT INTO servicios SET ?', service);
                    });
                  }
                });
              });
            });
          });
        });
      });
    });
  });
}

// Add this after database connection to ensure the uploads directory exists
const uploadDir = './uploads/mascotas';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// API Routes
app.get('/api/mascotas', (req, res) => {
  const query = `
    SELECT 
      id,
      nombre,
      raza,
      tamaño as tamano,
      edad,
      notas,
      usuario_id,
      imagen_url
    FROM mascotas`;
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching mascotas:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    const mascotasWithUrls = results.map(mascota => ({
      ...mascota,
      imagen_url: mascota.imagen_url ? `http://localhost:3000${mascota.imagen_url}` : null
    }));
    res.json(mascotasWithUrls);
  });
});

app.get('/api/servicios', (req, res) => {
  const query = 'SELECT * FROM servicios';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching servicios:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

const validateMascotaData = (data) => {
  const { nombre, raza, tamano } = data;
  if (!nombre || !raza || !tamano) {
    throw new Error('Missing required fields');
  }
  
  const validTamanos = ['pequeño', 'mediano', 'grande'];
  // Normalize the string to handle encoding issues
  const normalizedTamano = tamano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedValidTamanos = validTamanos.map(t => 
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );
  
  if (!normalizedValidTamanos.includes(normalizedTamano)) {
    throw new Error(`Invalid tamano value: ${tamano}. Must be one of: pequeño, mediano, grande`);
  }
};

// Update the POST mascota endpoint
app.post('/api/mascotas', upload.single('imagen'), async (req, res) => {
  try {
    const { 
      nombre, 
      raza, 
      tamano = 'mediano', 
      edad = 0,
      tipoEdad = 'años', 
      notas = '' 
    } = req.body;

    // Set default usuario_id to 1 for now
    // In production, this should come from authenticated user session
    const usuario_id = 1; // Add this line to define usuario_id

    // Validate edad
    const edadNum = parseInt(edad);
    if (edadNum < 0) {
      throw new Error('La edad no puede ser negativa');
    }
    if (tipoEdad === 'años' && edadNum > 30) {
      throw new Error('La edad en años no puede ser mayor a 30');
    }
    if (tipoEdad === 'meses' && edadNum > 360) {
      throw new Error('La edad en meses no puede ser mayor a 360');
    }

    let imagen_url = null;
    if (req.file) {
      imagen_url = `/uploads/mascotas/${req.file.filename}`;
    }

    // Add validation for required fields
    validateMascotaData({ nombre, raza, tamano });

    const [result] = await connection.promise().query(
      `INSERT INTO mascotas (nombre, raza, tamaño, edad, tipo_edad, notas, usuario_id, imagen_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, raza, tamano, edadNum, tipoEdad, notas, usuario_id, imagen_url]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      raza,
      tamano,
      edad: edadNum,
      tipoEdad,
      notas,
      usuario_id,
      imagen_url: imagen_url ? `http://localhost:3000${imagen_url}` : null
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the PUT endpoint
app.put('/api/mascotas/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, raza, tamano, edad, notas } = req.body;
    let imagen_url = null;

    if (req.file) {
      // Store only the relative path
      imagen_url = `/uploads/mascotas/${req.file.filename}`;
    }

    // Validate mascota data
    validateMascotaData({ nombre, raza, tamano });

    const query = `
      UPDATE mascotas 
      SET nombre = ?, 
          raza = ?, 
          tamaño = ?, 
          edad = ?, 
          notas = ?
          ${imagen_url ? ', imagen_url = ?' : ''}
      WHERE id = ?
    `;

    const values = imagen_url ? 
      [nombre, raza, tamano, edad, notas, imagen_url, id] :
      [nombre, raza, tamano, edad, notas, id];

    await connection.promise().query(query, values);
    
    const [updatedMascota] = await connection.promise().query(
      'SELECT *, tamaño as tamano FROM mascotas WHERE id = ?',
      [id]
    );

    // Add full URL for the response
    const mascotaWithFullUrl = {
      ...updatedMascota[0],
      imagen_url: imagen_url ? `http://localhost:3000${imagen_url}` : null
    };

    res.json(mascotaWithFullUrl);
  } catch (error) {
    console.error('Error updating mascota:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

app.post('/api/servicios', (req, res) => {
  const { nombre, duracion, precio, descripcion, imagen } = req.body;
  connection.query(
    'INSERT INTO servicios (nombre, duracion, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)',
    [nombre, duracion, precio, descripcion, imagen],
    (error, result) => {
      if (error) {
        console.error('Error adding servicio:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: result.insertId, nombre, duracion, precio, descripcion, imagen });
    }
  );
});

// Add Stripe integration

app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'mxn',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Stripe Checkout endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  const { servicio, mascotaId } = req.body;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: servicio.nombre,
              description: `Paseo para mascota ID: ${mascotaId}`
            },
            unit_amount: servicio.precio * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:4200/confirmacion?session_id={CHECKOUT_SESSION_ID}&servicio_id=${servicio.id}&mascota_id=${mascotaId}`,
      cancel_url: 'http://localhost:4200/paseos',
      metadata: {
        servicio_id: servicio.id,
        mascota_id: mascotaId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add paseo creation endpoint
app.post('/api/paseos/create-from-payment', async (req, res) => {
  const { session_id, servicio_id, mascota_id } = req.body;

  try {
    // Get service details first
    const [servicios] = await connection.promise().query(
      'SELECT * FROM servicios WHERE id = ?',
      [servicio_id]
    );

    if (!servicios || servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    const servicio = servicios[0];
    const precio = Number(servicio.precio);

    // Create paseo record
    const [result] = await connection.promise().query(
      `INSERT INTO paseos (usuario_id, mascota_id, paseador_id, fecha, estado, servicio_id) 
       VALUES (?, ?, 1, NOW(), 'completado', ?)`,
      [1, mascota_id, servicio_id]
    );

    // Generate invoice XML
    const xmlContent = generateInvoiceXML({
      folio: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
      fecha: new Date().toISOString(),
      monto: precio,
      servicio_nombre: servicio.nombre,
      duracion: servicio.duracion
    });

    // Update paseo with XML
    await connection.promise().query(
      'UPDATE paseos SET comprobante_xml = ? WHERE id = ?',
      [xmlContent, result.insertId]
    );

    res.json({ 
      success: true, 
      paseo_id: result.insertId,
      xml: xmlContent 
    });
  } catch (error) {
    console.error('Error creating paseo:', error);
    res.status(500).json({ error: error.message || 'Error creating paseo' });
  }
});

function generateInvoiceXML(data) {
  const monto = Number(data.monto);
  const iva = monto * 0.16;
  const total = monto + iva;
  const uuid = 'a1b2c3d4-' + Math.random().toString(36).substring(2, 15);

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"
  Version="4.0"
  Serie="A"
  Folio="${data.folio}"
  Fecha="${data.fecha}"
  FormaPago="01"
  SubTotal="${monto.toFixed(2)}"
  Moneda="MXN"
  Total="${total.toFixed(2)}"
  TipoDeComprobante="I"
  MetodoPago="PUE"
  LugarExpedicion="44100">
 
  <cfdi:Emisor
    Rfc="PPE250101XX1"
    Nombre="Patitas Felices"
    RegimenFiscal="601"/>
 
  <cfdi:Receptor
    Rfc="XAXX010101000"
    Nombre="Cliente General"
    DomicilioFiscalReceptor="44100"
    RegimenFiscalReceptor="616"
    UsoCFDI="G03"/>
 
  <cfdi:Conceptos>
    <cfdi:Concepto
      ClaveProdServ="90111501"
      Cantidad="1"
      ClaveUnidad="E48"
      Unidad="Servicio"
      Descripcion="Servicio de paseo de perro - ${data.servicio_nombre} - Duración: ${data.duracion} minutos - Fecha: ${data.fecha.split('T')[0]}"
      ValorUnitario="${monto.toFixed(2)}"
      Importe="${monto.toFixed(2)}"
      ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado
            Base="${monto.toFixed(2)}"
            Impuesto="002"
            TipoFactor="Tasa"
            TasaOCuota="0.160000"
            Importe="${iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
 
  <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado
        Base="${monto.toFixed(2)}"
        Impuesto="002"
        TipoFactor="Tasa"
        TasaOCuota="0.160000"
        Importe="${iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
 
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital
      xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
      xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd"
      Version="1.1"
      UUID="${uuid}"
      FechaTimbrado="${new Date().toISOString()}"
      SelloCFD="XXX"
      NoCertificadoSAT="00001000000504465028"
      SelloSAT="XXX"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
}

app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add XML generation and storage endpoint
app.post('/api/generate-invoice', async (req, res) => {
  try {
    const { paseoId, servicioId, mascotaId, monto } = req.body;
    const fecha = new Date().toISOString();
    const folio = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    // Generate XML content
    const xmlContent = generateInvoiceXML({
      folio,
      fecha,
      monto,
      servicioId,
      mascotaId
    });

    // Store in database
    const query = `
      UPDATE paseos 
      SET comprobante_xml = ? 
      WHERE id = ?`;
    
    await connection.promise().query(query, [xmlContent, paseoId]);

    // Return both XML content and file URL
    res.json({
      xml: xmlContent,
      folio: folio
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to create sample invoices
app.post('/api/facturas/generate-samples', async (req, res) => {
  try {
    // Create two sample paseos with invoices
    const samplePaseos = [
      {
        servicio_id: 2,
        mascota_id: 1,
        monto: 250.00,
        servicio_nombre: 'Paseo Estándar'
      },
      {
        servicio_id: 3,
        mascota_id: 1,
        monto: 350.00,
        servicio_nombre: 'Paseo Premium'
      }
    ];

    for (const paseo of samplePaseos) {
      const [result] = await connection.promise().query(
        `INSERT INTO paseos (usuario_id, mascota_id, paseador_id, fecha, estado, servicio_id) 
         VALUES (1, ?, 1, NOW(), 'completado', ?)`,
        [paseo.mascota_id, paseo.servicio_id]
      );

      const xmlContent = generateInvoiceXML(paseo);
      
      await connection.promise().query(
        'UPDATE paseos SET comprobante_xml = ? WHERE id = ?',
        [xmlContent, result.insertId]
      );
    }

    res.json({ message: 'Sample invoices created successfully' });
  } catch (error) {
    console.error('Error creating sample invoices:', error);
    res.status(500).json({ error: 'Error creating sample invoices' });
  }
});

// Add route to get facturas
app.get('/api/facturas', (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.fecha,
      s.nombre as servicio_nombre,
      s.precio as monto,
      p.estado,
      p.comprobante_xml
    FROM paseos p
    JOIN servicios s ON p.servicio_id = s.id
    JOIN mascotas m ON p.mascota_id = m.id
    WHERE p.estado = 'completado'
    ORDER BY p.fecha DESC
  `;
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching facturas:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    res.json(results || []);
  });
});

app.delete('/api/mascotas/:id', (req, res) => {
  const { id } = req.params;
  
  connection.query('SELECT imagen FROM mascotas WHERE id = ?', [id], (err, results) => {
    if (results?.[0]?.imagen) {
      const filePath = path.join(__dirname, results[0].imagen);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    connection.query('DELETE FROM mascotas WHERE id = ?', [id], (error) => {
      if (error) {
        console.error('Error deleting mascota:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ message: 'Mascota deleted successfully' });
    });
  });
});

// Add sample paseos endpoint
app.post('/api/sample-paseos', async (req, res) => {
  try {
    const [servicios] = await connection.promise().query('SELECT * FROM servicios');
    const [mascotas] = await connection.promise().query('SELECT id FROM mascotas LIMIT 1');
    const mascotaId = mascotas[0]?.id || 1;

    for (const servicio of servicios) {
      // Create paseo record
      const [result] = await connection.promise().query(
        `INSERT INTO paseos (usuario_id, mascota_id, paseador_id, fecha, estado, servicio_id) 
         VALUES (?, ?, 1, NOW(), 'completado', ?)`,
        [1, mascotaId, servicio.id]
      );

      const xmlContent = generateInvoiceXML({
        folio: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        fecha: new Date().toISOString(),
        monto: servicio.precio,
        servicio_nombre: servicio.nombre,
        duracion: servicio.duracion,
        mascota_id: mascotaId
      });

      await connection.promise().query(
        'UPDATE paseos SET comprobante_xml = ? WHERE id = ?',
        [xmlContent, result.insertId]
      );
    }

    res.json({ message: 'Sample paseos created successfully' });
  } catch (error) {
    console.error('Error creating sample paseos:', error);
    res.status(500).json({ error: 'Error creating sample paseos' });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Demasiados intentos, por favor intente más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Demasiados intentos, por favor intente más tarde',
      remainingTime: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/recuperar', authLimiter);

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    
    if (!correo || !contrasena) {
      return res.status(400).json({ 
        message: 'Correo y contraseña son requeridos' 
      });
    }

    // Hash the provided password
    const hashedPassword = hashPassword(contrasena);

    // Check credentials with hashed password
    const [users] = await connection.promise().query(
      'SELECT id, nombre, apellido, correo, rol FROM usuarios WHERE correo = ? AND contraseña = ?',
      [correo, hashedPassword]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: users[0].id, rol: users[0].rol },
      authConfig.secret,
      { expiresIn: authConfig.jwtExpiration }
    );

    res.json({ 
      usuario: users[0],
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre, apellido, correo, telefono, direccion, contrasena, rol } = req.body;

    // Validate email
    if (!validator.isEmail(correo)) {
      return res.status(400).json({ message: 'Correo electrónico inválido' });
    }

    // Validate password length and complexity
    if (!validator.isLength(contrasena, { min: 8 })) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 8 caracteres' 
      });
    }

    // Check if user exists
    const [existingUsers] = await connection.promise().query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hash password with SHA-512
    const hashedPassword = hashPassword(contrasena);

    // Insert new user
    const [result] = await connection.promise().query(
      `INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, contraseña, rol) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, correo, telefono, direccion, hashedPassword, rol]
    );

    // Create paseador record if role is paseador
    if (rol === 'paseador') {
      await connection.promise().query(
        'INSERT INTO paseadores (usuario_id, zona_servicio, tarifa) VALUES (?, ?, ?)',
        [result.insertId, 'Zona 1', 100]
      );
    }

    res.status(201).json({
      id: result.insertId,
      nombre,
      apellido,
      correo,
      rol
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/recuperar', async (req, res) => {
  try {
    const { correo } = req.body;
    
    const [users] = await connection.promise().query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const token = jwt.sign(
      { id: users[0].id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await connection.promise().query(
      'UPDATE usuarios SET token_recuperacion = ? WHERE id = ?',
      [token, users[0].id]
    );

    const emailSent = await sendRecoveryEmail(correo, token);

    if (!emailSent) {
      return res.status(500).json({ message: 'Error al enviar el correo' });
    }

    res.json({ message: 'Se ha enviado un enlace de recuperación a tu correo' });
  } catch (error) {
    console.error('Recovery error:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

app.post('/api/auth/restablecer', async (req, res) => {
  try {
    const { token, nuevaContrasena } = req.body;
    
    if (!token || !nuevaContrasena) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    const [users] = await connection.promise().query(
      'SELECT id FROM usuarios WHERE token_recuperacion = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    await connection.promise().query(
      'UPDATE usuarios SET contraseña = ?, token_recuperacion = NULL WHERE id = ?',
      [nuevaContrasena, users[0].id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
});

// Add helper function for SHA-512 hashing
function hashPassword(password) {
  return crypto.createHash('sha512').update(password).digest('hex');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
