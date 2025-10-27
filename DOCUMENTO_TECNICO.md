# DOCUMENTO TÉCNICO - JOBHIVE

## Sistema de Gestión de Empleos con Servicios Cloud

---

## 1. OBJETIVOS DEL PROYECTO

### 1.1 Objetivo General

Desarrollar una plataforma web integral de gestión de empleos que aproveche servicios cloud de AWS y Azure para proporcionar funcionalidades avanzadas de inteligencia artificial, almacenamiento distribuido, y autenticación segura.

### 1.2 Objetivos Específicos

#### Técnicos

-   Implementar una arquitectura cloud-native escalable y resiliente
-   Integrar servicios de inteligencia artificial para procesamiento de imágenes y texto
-   Establecer un sistema de autenticación y autorización robusto mediante AWS Cognito
-   Automatizar procesos de comunicación mediante servicios de email
-   Garantizar el almacenamiento seguro y eficiente de archivos multimedia
-   Implementar procesamiento de documentos PDF y análisis de texto

#### Funcionales

-   Permitir el registro y autenticación de usuarios (candidatos y administradores)
-   Facilitar la publicación y gestión de ofertas laborales
-   Automatizar el análisis de currículums mediante OCR e IA
-   Proporcionar recomendaciones de empleos basadas en habilidades detectadas
-   Notificar a usuarios sobre postulaciones y actualizaciones
-   Generar contenido de audio a partir de texto (accesibilidad)
-   Soportar traducción multiidioma de contenidos

---

## 2. DESCRIPCIÓN DEL PROYECTO

### 2.1 Resumen Ejecutivo

**JobHive** (también conocido como HireVision) es una plataforma web moderna de gestión de empleos que conecta candidatos con oportunidades laborales. La aplicación utiliza tecnologías de inteligencia artificial y servicios cloud para automatizar y optimizar el proceso de reclutamiento.

### 2.2 Propósito

Simplificar el proceso de búsqueda y postulación a empleos mediante:

-   Análisis automático de habilidades en documentos e imágenes
-   Matching inteligente entre candidatos y ofertas laborales
-   Notificaciones automáticas
-   Gestión centralizada de postulaciones

### 2.3 Público Objetivo

#### Candidatos (Usuarios)

-   Profesionales en búsqueda activa de empleo
-   Personas que desean postularse a múltiples ofertas
-   Usuarios que buscan recomendaciones personalizadas

#### Reclutadores (Administradores)

-   Empresas que publican ofertas laborales
-   Departamentos de recursos humanos
-   Agencias de reclutamiento

### 2.4 Stack Tecnológico

#### Frontend

-   **React 18.3.1**: Biblioteca de JavaScript para interfaces de usuario
-   **React Router DOM**: Navegación entre páginas
-   **React Icons**: Biblioteca de iconos
-   **React Quill**: Editor de texto enriquecido
-   **Recharts**: Visualización de datos
-   **SweetAlert2**: Alertas y notificaciones elegantes

#### Backend

-   **Node.js** con **Express 4.21.1**: Framework de servidor web
-   **MySQL2**: Base de datos relacional
-   **AWS SDK 2.1691.0**: Integración con servicios AWS
-   **jsonwebtoken**: Manejo de tokens JWT
-   **jwks-rsa**: Validación de tokens Cognito
-   **Nodemailer**: Envío de correos electrónicos
-   **pdf-parse**: Extracción de texto de PDFs
-   **dotenv**: Gestión de variables de entorno

---

## 3. ARQUITECTURA IMPLEMENTADA

### 3.1 Diagrama Arquitectónico

#### 3.1.1 Arquitectura General del Sistema

```mermaid
graph TB
    subgraph "CAPA DE PRESENTACIÓN"
        Frontend["<b>REACT FRONTEND</b><br/>(Puerto 3000)<br/>• Login/Signup<br/>• Job Browser<br/>• CV Upload<br/>• Image Analyzer<br/>• Applications<br/>• Admin Panel"]
    end

    subgraph "CAPA DE APLICACIÓN"
        Backend["<b>NODE.JS + EXPRESS API</b><br/>(Puerto 3001)<br/><br/><b>Rutas:</b><br/>/users - Usuarios & Auth<br/>/jobs - Empleos & Postulaciones<br/>/polly - Síntesis de voz<br/>/ - Healthcheck<br/><br/><b>Middleware:</b><br/>authenticateJWT"]
    end

    subgraph "CAPA DE DATOS Y SERVICIOS"
        Cognito["<b>AWS COGNITO</b><br/>• User Pool<br/>• Auth Flow<br/>• JWT Tokens"]
        Database["<b>MYSQL DATABASE</b><br/>Tablas:<br/>• USUARIO<br/>• EMPLEO<br/>• POSTULACION<br/>• HABILIDAD<br/>• EMPLEO_HABILIDAD"]
        AWSServices["<b>AWS SERVICES</b><br/>• S3<br/>• Rekognition<br/>• Polly<br/>• Translate<br/>• SES"]
    end

    Frontend -->|"HTTPS REST API"| Backend
    Backend --> Cognito
    Backend --> Database
    Backend --> AWSServices

    style Frontend fill:#e1f5ff
    style Backend fill:#fff4e1
    style Cognito fill:#ffe1f5
    style Database fill:#e1ffe1
    style AWSServices fill:#f5e1ff
```

#### 3.1.2 Servicios Cloud Detallados

```mermaid
graph LR
    subgraph "AWS SERVICES"
        subgraph "Autenticación"
            Cognito["<b>COGNITO</b><br/>• User Pool<br/>• Auth<br/>• JWT"]
        end

        subgraph "Almacenamiento"
            S3["<b>S3</b><br/>• Bucket: imagenes/<br/>• Bucket: cvs/"]
        end

        subgraph "IA - Visión"
            Rekognition["<b>REKOGNITION</b><br/>• OCR Text<br/>• Detection<br/>• Image Analysis"]
        end

        subgraph "IA - Audio"
            Polly["<b>POLLY</b><br/>• Text-to-Speech<br/>• Voice: Enrique"]
        end

        subgraph "IA - Traducción"
            Translate["<b>TRANSLATE</b><br/>• Multi-language<br/>• Auto Detect"]
        end

        subgraph "Comunicación"
            SES["<b>SES</b><br/>• SMTP Relay<br/>• Verified Emails"]
        end
    end

    style Cognito fill:#ff9999
    style S3 fill:#99ccff
    style Rekognition fill:#99ff99
    style Polly fill:#ffcc99
    style Translate fill:#cc99ff
    style SES fill:#ff99cc
```

### 3.2 Flujo de Datos

#### 3.2.1 Flujo de Registro de Usuario

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant C as AWS Cognito
    participant S3 as AWS S3
    participant DB as MySQL

    U->>F: Completa formulario<br/>(nombre, email, password, foto)
    F->>B: POST /users/signup<br/>con datos + imagen base64
    B->>C: signUp() - Crea usuario
    C-->>B: Usuario creado
    B->>S3: upload() - Sube foto de perfil
    S3-->>B: URL de la imagen
    B->>DB: INSERT en tabla USUARIO
    DB-->>B: Confirmación
    C->>U: Email con código<br/>de verificación
    U->>F: Ingresa código de 6 dígitos
    F->>B: POST /users/confirm
    B->>C: confirmSignUp()
    C-->>B: Cuenta confirmada
    B-->>F: Confirmación exitosa
    F->>F: Redirige a login
```

#### 3.2.2 Flujo de Inicio de Sesión

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant C as AWS Cognito
    participant DB as MySQL

    U->>F: Ingresa email y contraseña
    F->>B: POST /users/signin
    B->>C: initiateAuth()<br/>(USER_PASSWORD_AUTH)
    C-->>B: IdToken + AccessToken
    B->>DB: SELECT * FROM USUARIO<br/>WHERE CORREO = ?
    DB-->>B: Datos del usuario
    B-->>F: Token + datos de usuario
    F->>F: Almacena en localStorage
    alt Usuario Regular
        F->>F: Redirige a /user
    else Administrador
        F->>F: Redirige a /admin
    end
```

#### 3.2.3 Flujo de Análisis de Imagen (OCR)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant R as AWS Rekognition
    participant DB as MySQL

    U->>F: Selecciona imagen con texto<br/>(certificado, diploma)
    F->>B: POST /users/analyzeText<br/>con imagen base64
    B->>R: detectText()
    R->>R: Análisis OCR de la imagen
    R-->>B: TextDetections[]<br/>(palabras y líneas detectadas)
    B->>B: Procesa texto detectado<br/>Extrae habilidades técnicas
    B-->>F: Array de habilidades<br/>["React", "Node.js", "AWS"]
    F->>B: POST /jobs/match-skills<br/>con habilidades detectadas
    B->>DB: SELECT empleos WHERE<br/>habilidades IN (...)
    DB-->>B: Lista de empleos<br/>con coincidencias
    B->>B: Calcula % de match<br/>por cada empleo
    B-->>F: Lista de empleos recomendados<br/>con porcentaje de compatibilidad
    F->>U: Muestra empleos sugeridos
```

#### 3.2.4 Flujo de Subida de CV

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant S3 as AWS S3
    participant DB as MySQL
    participant PDF as pdf-parse

    U->>F: Selecciona archivo<br/>(PDF o imagen)
    F->>B: POST /users/upload-cv<br/>con archivo base64
    B->>S3: upload() - Sube archivo<br/>a bucket cvs/
    S3-->>B: URL del archivo<br/>(https://s3.../cv.pdf)

    alt Archivo es PDF
        B->>PDF: extractTextFromPDF()
        PDF-->>B: Texto extraído del CV
        B->>B: Analiza habilidades<br/>del texto (opcional)
    end

    B->>DB: UPDATE USUARIO<br/>SET CV = url WHERE ID = ?
    DB-->>B: CV actualizado
    B-->>F: Confirmación + URL del CV
    F->>F: Actualiza localStorage
    F->>U: "CV subido exitosamente"
```

#### 3.2.5 Flujo de Postulación a Empleo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as MySQL
    participant SES as AWS SES

    U->>F: Hace clic en "Postularme"<br/>en una oferta de empleo
    F->>B: POST /jobs/apply<br/>{userId, jobId}

    B->>DB: SELECT FROM POSTULACION<br/>WHERE usuario=? AND empleo=?

    alt Ya se postuló antes
        DB-->>B: Registro existente
        B-->>F: Error: "Ya aplicaste<br/>a este empleo"
        F->>U: Mensaje de error
    else Primera postulación
        DB-->>B: Sin registros
        B->>DB: INSERT INTO POSTULACION<br/>(usuario, empleo, fecha, estado)
        DB-->>B: Postulación creada
        B->>SES: sendEmail()<br/>Confirmación de postulación
        SES->>U: Email de confirmación
        B-->>F: "Postulación exitosa"
        F->>U: Mensaje de éxito
    end
```

#### 3.2.6 Flujo de Síntesis de Voz (Text-to-Speech)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant P as AWS Polly

    U->>F: Solicita lectura de texto<br/>(descripción de empleo)
    F->>B: POST /polly/synthesize<br/>{text: "...", voiceId: "Enrique"}
    B->>P: synthesizeSpeech()<br/>{Text, VoiceId, OutputFormat: "mp3"}
    P->>P: Genera audio con<br/>voz neuronal
    P-->>B: AudioStream (MP3)
    B->>B: Convierte a Base64<br/>audioData = buffer.toString("base64")
    B-->>F: {audioData: "base64...",<br/>audioFormat: "mp3"}
    F->>F: Decodifica Base64<br/>Crea elemento <audio>
    F->>U: Reproduce audio
    U->>U: Escucha el texto
```

### 3.3 Relación entre Servicios

```mermaid
graph TD
    subgraph "Integración de Servicios"
        A[Cognito + MySQL]
        B[S3 + MySQL]
        C[Rekognition + Translate]
        D[SES + Cognito]
    end

    subgraph "Cognito + MySQL"
        A1[AWS Cognito<br/>Autenticación<br/>Generación de tokens]
        A2[MySQL<br/>Datos de usuario<br/>Relaciones]
        A1 <-->|Email como<br/>vínculo| A2
    end

    subgraph "S3 + MySQL"
        B1[AWS S3<br/>Almacenamiento<br/>de archivos<br/>fotos y CVs]
        B2[MySQL<br/>Almacena URLs<br/>de recursos en S3]
        B1 -->|Genera URL| B2
        B2 -->|Referencia| B1
    end

    subgraph "Rekognition + Translate"
        C1[AWS Rekognition<br/>Extrae texto<br/>de imágenes OCR]
        C2[AWS Translate<br/>Traduce texto<br/>multiidioma]
        C1 -->|Texto extraído| C2
        C2 -->|Texto traducido| C3[Procesamiento<br/>de habilidades]
    end

    subgraph "SES + Cognito"
        D1[AWS Cognito<br/>Trigger de eventos<br/>de usuario]
        D2[AWS SES<br/>Envío de emails<br/>transaccionales]
        D1 -->|Eventos| D2
        D2 -->|Confirmaciones<br/>Notificaciones| D3[Usuario]
    end

    style A1 fill:#ff9999
    style A2 fill:#99ff99
    style B1 fill:#99ccff
    style B2 fill:#99ff99
    style C1 fill:#99ff99
    style C2 fill:#cc99ff
    style C3 fill:#ffcc99
    style D1 fill:#ff9999
    style D2 fill:#ff99cc
    style D3 fill:#e1e1e1
```

---

## 4. PRESUPUESTO DEL PROYECTO

### 4.1 Servicios AWS

| Servicio                      | Tier             | Uso Estimado                              | Costo Mensual                     | Justificación                                                                            |
| ----------------------------- | ---------------- | ----------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| **AWS Cognito**               | Free Tier + Paid | 10,000 MAU¹                               | $0.00 - $50.00²                   | Primer proveedor de identidad: 50,000 MAU gratis. Escalable y seguro para autenticación. |
| **Amazon S3**                 | Standard         | 10 GB storage<br>10,000 PUT<br>50,000 GET | $0.23 + $0.05 + $0.02 = **$0.30** | Almacenamiento confiable para imágenes y CVs. Alta durabilidad (99.999999999%).          |
| **AWS Rekognition**           | Pay per use      | 1,000 imágenes/mes                        | $1.00 (primeras 1M gratis)        | OCR preciso para análisis de documentos e imágenes con habilidades.                      |
| **Amazon Polly**              | Pay per use      | 5 millones caracteres                     | $4.00 (1M chars gratis)           | Text-to-speech de alta calidad para accesibilidad.                                       |
| **Amazon Translate**          | Pay per use      | 2 millones caracteres                     | $15.00                            | Traducción automática multiidioma en tiempo real.                                        |
| **Amazon SES**                | SMTP             | 62,000 emails/mes                         | $0.00³                            | Primeros 62,000 emails gratis desde EC2. Confiable para transaccionales.                 |
| **AWS RDS MySQL** (opcional⁴) | db.t3.micro      | 20 GB SSD                                 | $15.33                            | Base de datos gestionada con backups automáticos.                                        |

**Subtotal AWS**: $35.63 - $85.63/mes

**Notas**:

1. MAU = Monthly Active Users (Usuarios Activos Mensuales)
2. Cognito cobra $0.0055 por MAU después de los primeros 50,000
3. SES desde EC2 es gratis hasta 62,000 emails/mes. Desde otros servicios: $0.10 por 1,000 emails
4. En el proyecto actual se usa MySQL autogestionado (host externo), pero se recomienda migrar a RDS

### 4.2 Servicios de Infraestructura

| Servicio                | Especificaciones                    | Costo Mensual  | Justificación                                              |
| ----------------------- | ----------------------------------- | -------------- | ---------------------------------------------------------- |
| **Hosting Backend**     | VPS/EC2 t3.small<br>2 vCPU, 2GB RAM | $15.00         | Node.js API con Express. Puede usar EC2 o VPS externo.     |
| **Hosting Frontend**    | S3 + CloudFront (estático)          | $1.00 - $5.00  | React build estático. CloudFront opcional para CDN global. |
| **Base de Datos MySQL** | Autogestionada o RDS                | $0.00 - $15.33 | Actualmente externa. RDS ofrece mejor gestión.             |
| **Dominio**             | .com o .net                         | $1.00          | Opcional para producción.                                  |

**Subtotal Infraestructura**: $17.00 - $36.33/mes

### 4.3 Resumen de Costos

| Categoría           | Costo Mínimo | Costo Máximo  |
| ------------------- | ------------ | ------------- |
| Servicios AWS IA    | $20.30       | $70.30        |
| Almacenamiento (S3) | $0.30        | $0.30         |
| Base de Datos       | $0.00        | $15.33        |
| Infraestructura     | $17.00       | $36.33        |
| **TOTAL MENSUAL**   | **$37.60**   | **$122.26**   |
| **TOTAL ANUAL**     | **$451.20**  | **$1,467.12** |

### 4.4 Optimizaciones de Costos

#### Corto Plazo

1. **Free Tier Intensivo**: Aprovechar los 12 meses de free tier de AWS
2. **Caching**: Implementar Redis/CloudFront para reducir llamadas a APIs
3. **Batch Processing**: Agrupar solicitudes de traducción y síntesis de voz
4. **Compresión de Imágenes**: Reducir tamaño antes de subir a S3

#### Mediano Plazo

1. **Reserved Instances**: Ahorrar hasta 72% en EC2/RDS con compromisos de 1-3 años
2. **S3 Intelligent Tiering**: Mover archivos antiguos a S3 Glacier (90% más barato)
3. **Lambda para Backend**: Serverless puede ser más económico con tráfico variable
4. **API Gateway Caching**: Reducir llamadas repetidas a servicios AWS

#### Largo Plazo

1. **Multi-Cloud**: Azure ofrece créditos educativos y algunos servicios más baratos
2. **CDN Externo**: Cloudflare CDN gratis puede reemplazar CloudFront
3. **Open Source Alternatives**: Considerar Tesseract OCR local vs Rekognition para pruebas

---

## 5. INVESTIGACIÓN DE SERVICIOS UTILIZADOS

### 5.1 Servicios Obligatorios

#### 5.1.1 AWS Cognito

**Descripción Técnica**
Amazon Cognito es un servicio de identidad que proporciona autenticación, autorización y gestión de usuarios. Soporta OAuth 2.0, SAML 2.0, y OpenID Connect.

**Características Técnicas**

-   **User Pools**: Directorio de usuarios con registro/login
-   **Identity Pools**: Credenciales temporales para acceso a AWS
-   **MFA**: Autenticación multifactor opcional
-   **JWT Tokens**: IdToken, AccessToken, RefreshToken
-   **Triggers Lambda**: Personalización de flujos de autenticación

**Implementación en JobHive**

```javascript
// Registro con SECRET_HASH
const secretHash = crypto
    .createHmac("SHA256", CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest("base64");

const signUpParams = {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    SecretHash: secretHash,
};

await cognito.signUp(signUpParams).promise();
```

**Justificación**

-   Elimina la necesidad de gestionar contraseñas manualmente
-   Cumplimiento con estándares de seguridad (OWASP, GDPR)
-   Escalabilidad automática
-   Integración nativa con otros servicios AWS

**Endpoints Utilizados**

-   `signUp`: Registro de usuarios
-   `confirmSignUp`: Verificación de email
-   `initiateAuth`: Inicio de sesión (USER_PASSWORD_AUTH)

---

#### 5.1.2 Amazon S3 (Simple Storage Service)

**Descripción Técnica**
Servicio de almacenamiento de objetos con durabilidad del 99.999999999% (11 nueves). Almacena datos como objetos dentro de buckets.

**Características Técnicas**

-   **Escalabilidad Ilimitada**: Almacenamiento sin límites
-   **Versionado**: Historial de cambios en objetos
-   **Lifecycle Policies**: Transición automática entre clases de almacenamiento
-   **Encryption**: SSE-S3, SSE-KMS, SSE-C
-   **Access Control**: IAM policies, Bucket policies, ACLs

**Implementación en JobHive**

```javascript
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadParams = {
    Bucket: "jobhive-bucket",
    Key: `imagenes/${email}-${Date.now()}.jpg`,
    Body: Buffer.from(base64Image, "base64"),
    ContentType: "image/jpeg",
};

const data = await s3.upload(uploadParams).promise();
const imageUrl = data.Location; // URL pública
```

**Estructura de Buckets**

```
jobhive-bucket/
├── imagenes/          # Fotos de perfil de usuarios
│   ├── user@email.com-1234567890.jpg
│   └── admin@email.com-1234567891.jpg
└── cvs/              # Currículums en PDF/imagen
    ├── user1-cv.pdf
    └── user2-resume.jpg
```

**Justificación**

-   Alta disponibilidad (99.99% SLA)
-   Costo bajo ($0.023 per GB)
-   Integración perfecta con CloudFront para CDN
-   Acceso directo mediante URLs HTTPS

---

#### 5.1.3 Base de Datos MySQL

**Descripción Técnica**
Sistema de gestión de bases de datos relacional open-source. En este proyecto se usa `mysql2` con Pool de conexiones.

**Esquema de Base de Datos**

```mermaid
erDiagram
    USUARIO ||--o{ POSTULACION : realiza
    EMPLEO ||--o{ POSTULACION : recibe
    EMPLEO ||--o{ EMPLEO_HABILIDAD : requiere
    HABILIDAD ||--o{ EMPLEO_HABILIDAD : pertenece

    USUARIO {
        int ID PK
        varchar NOMBRE
        varchar APELLIDO
        varchar CORREO UK
        date FECHA_NACIMIENTO
        text FOTO
        text CV
    }

    EMPLEO {
        int ID PK
        varchar PUESTO
        text DESCRIPCION
        decimal SALARIO
        datetime FECHA_CREACION
    }

    HABILIDAD {
        int ID PK
        varchar NOMBRE UK
    }

    EMPLEO_HABILIDAD {
        int ID PK
        int ID_EMPLEO FK
        int ID_HABILIDAD FK
    }

    POSTULACION {
        int ID PK
        int ID_USUARIO FK
        int ID_EMPLEO FK
        datetime FECHA_POSTULACION
        enum ESTADO
    }
```

**Script SQL**

```sql
-- Tabla de usuarios
CREATE TABLE USUARIO (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    NOMBRE VARCHAR(100) NOT NULL,
    APELLIDO VARCHAR(100) NOT NULL,
    CORREO VARCHAR(255) UNIQUE NOT NULL,
    FECHA_NACIMIENTO DATE,
    FOTO TEXT,  -- URL de S3
    CV TEXT     -- URL de S3
);

-- Tabla de empleos
CREATE TABLE EMPLEO (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    PUESTO VARCHAR(255) NOT NULL,
    DESCRIPCION TEXT,
    SALARIO DECIMAL(10,2),
    FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de habilidades
CREATE TABLE HABILIDAD (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    NOMBRE VARCHAR(100) UNIQUE NOT NULL
);

-- Relación muchos a muchos: Empleo-Habilidad
CREATE TABLE EMPLEO_HABILIDAD (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ID_EMPLEO INT NOT NULL,
    ID_HABILIDAD INT NOT NULL,
    FOREIGN KEY (ID_EMPLEO) REFERENCES EMPLEO(ID),
    FOREIGN KEY (ID_HABILIDAD) REFERENCES HABILIDAD(ID),
    UNIQUE(ID_EMPLEO, ID_HABILIDAD)
);

-- Tabla de postulaciones
CREATE TABLE POSTULACION (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ID_USUARIO INT NOT NULL,
    ID_EMPLEO INT NOT NULL,
    FECHA_POSTULACION DATETIME DEFAULT CURRENT_TIMESTAMP,
    ESTADO ENUM('pendiente', 'revisando', 'aceptado', 'rechazado')
           DEFAULT 'pendiente',
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID),
    FOREIGN KEY (ID_EMPLEO) REFERENCES EMPLEO(ID),
    UNIQUE(ID_USUARIO, ID_EMPLEO)  -- No duplicar postulaciones
);
```

**Configuración de Pool**

```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 2, // Máximo 2 conexiones simultáneas
    queueLimit: 0, // Sin límite de cola
});
```

**Justificación**

-   Soporte de transacciones ACID
-   Relaciones complejas (usuarios, empleos, habilidades)
-   Consultas JOIN eficientes
-   Amplia compatibilidad con ORMs y herramientas

---

### 5.2 Servicios de Inteligencia Artificial

#### 5.2.1 Amazon Rekognition

**Descripción Técnica**
Servicio de visión artificial que utiliza deep learning para analizar imágenes y videos. Ofrece detección de texto (OCR), reconocimiento facial, detección de objetos, y más.

**Características Técnicas**

-   **Text Detection**: OCR con confianza por detección
-   **Face Analysis**: Edad, género, emociones
-   **Object Detection**: Identificación de objetos
-   **Celebrity Recognition**: Identificación de personas famosas
-   **Content Moderation**: Detección de contenido inapropiado

**Implementación en JobHive**

```javascript
const rekognition = new AWS.Rekognition({
    region: "us-east-1",
});

const params = {
    Image: {
        Bytes: Buffer.from(base64Image, "base64"),
    },
};

const response = await rekognition.detectText(params).promise();

// Filtrar solo líneas y palabras
const detectedTexts = response.TextDetections.filter(
    (d) => d.Type === "LINE" || d.Type === "WORD"
).map((d) => d.DetectedText);

// Ejemplo de respuesta:
// ["JavaScript", "React", "Node.js", "AWS", "MySQL"]
```

**Caso de Uso en JobHive**

1. Usuario sube imagen de certificado o documento
2. Rekognition extrae habilidades/tecnologías mencionadas
3. Sistema busca empleos que requieren esas habilidades
4. Presenta recomendaciones personalizadas

**Justificación**

-   Precisión superior al 95% en detección de texto
-   Soporta múltiples idiomas
-   Procesamiento en milisegundos
-   No requiere entrenamiento de modelo

**Limitaciones**

-   Costo de $1.00 por 1,000 imágenes después del free tier
-   Requiere buena calidad de imagen
-   Texto muy pequeño puede no detectarse

---

#### 5.2.2 Amazon Polly

**Descripción Técnica**
Servicio de text-to-speech que convierte texto en audio realista. Utiliza tecnología de deep learning y Neural TTS (NTTS).

**Características Técnicas**

-   **Voces Neuronales**: Sonido más natural
-   **SSML Support**: Control de pronunciación, pausas, énfasis
-   **Idiomas Múltiples**: Más de 60 voces en 29 idiomas
-   **Formatos de Audio**: MP3, OGG, PCM
-   **Marcas de Tiempo**: Sincronización labial

**Implementación en JobHive**

```javascript
const polly = new AWS.Polly({
    region: "us-east-1",
});

const params = {
    OutputFormat: "mp3",
    Text: "Bienvenido a JobHive. Tienes 3 nuevas ofertas laborales.",
    VoiceId: "Enrique", // Voz en español (México)
    Engine: "neural", // Opcional: voz neuronal
};

const data = await polly.synthesizeSpeech(params).promise();
const audioBase64 = data.AudioStream.toString("base64");
```

**Voces Disponibles para Español**

-   **Enrique**: Español (España) - Masculino
-   **Conchita**: Español (España) - Femenino
-   **Miguel**: Español (US) - Masculino
-   **Lupe**: Español (US) - Femenino

**Caso de Uso en JobHive**

-   Leer descripciones de empleos para usuarios con discapacidad visual
-   Notificaciones de audio en la app
-   Asistente virtual para guiar el proceso de postulación

**Justificación**

-   Accesibilidad (WCAG 2.1 compliance)
-   UX mejorada
-   Costo bajo: $4.00 por millón de caracteres

---

#### 5.2.3 Amazon Translate

**Descripción Técnica**
Servicio de traducción automática neuronal que ofrece traducciones rápidas y precisas entre más de 75 idiomas.

**Características Técnicas**

-   **Neural Machine Translation (NMT)**: Mayor precisión
-   **Auto-detección de Idioma**: No requiere especificar idioma origen
-   **Traducción por Lotes**: Procesar múltiples textos
-   **Personalización**: Custom Terminology
-   **Tiempo Real**: Latencias bajas (<1 segundo)

**Implementación en JobHive**

```javascript
const translate = new AWS.Translate({
    region: "us-east-1",
});

const params = {
    SourceLanguageCode: "auto", // Detección automática
    TargetLanguageCode: "es", // Español
    Text: "Full-stack developer with React and Node.js experience",
};

const result = await translate.translateText(params).promise();
console.log(result.TranslatedText);
// "Desarrollador full-stack con experiencia en React y Node.js"
```

**Idiomas Soportados**

-   Inglés ↔ Español
-   Inglés ↔ Francés
-   Inglés ↔ Alemán
-   Y 70+ idiomas más

**Caso de Uso en JobHive**

-   Traducir ofertas laborales internacionales
-   Permitir CVs en múltiples idiomas
-   Interfaz multiidioma automática

**Justificación**

-   Expansión a mercados internacionales
-   Inclusión de usuarios no hispanohablantes
-   Costo: $15.00 por millón de caracteres

---

### 5.3 Servicios Secundarios

#### 5.3.1 Amazon SES (Simple Email Service)

**Descripción Técnica**
Plataforma de envío de emails escalable y económica basada en SMTP. Ofrece alta tasa de entrega (deliverability) y reputación de IP gestionada.

**Características Técnicas**

-   **SMTP Interface**: Compatible con Nodemailer
-   **API RESTful**: Envío programático
-   **Bounce Handling**: Gestión automática de rebotes
-   **Complaint Management**: Manejo de reportes de spam
-   **Verified Identities**: Dominios y emails verificados

**Implementación en JobHive**

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false, // TLS
    auth: {
        user: process.env.SES_SMTP_USERNAME,
        pass: process.env.SES_SMTP_PASSWORD,
    },
});

const mailOptions = {
    from: "noreply@jobhive.com",
    to: userEmail,
    subject: "¡Postulación exitosa!",
    html: `
        <h1>¡Hola ${userName}!</h1>
        <p>Tu postulación al puesto de <strong>${jobTitle}</strong> ha sido recibida.</p>
    `,
};

await transporter.sendMail(mailOptions);
```

**Tipos de Emails Enviados**

1. **Confirmación de Cuenta**: Código de verificación de Cognito
2. **Postulación Exitosa**: Confirmación de aplicación a empleo
3. **Actualización de Postulación**: Cambios de estado
4. **Nuevas Ofertas**: Recomendaciones basadas en perfil

**Ventajas de SES sobre otros servicios**

-   **Gratis**: 62,000 emails/mes desde EC2
-   **Alta Entrega**: 98%+ deliverability
-   **Reputación Gestionada**: IPs compartidas de AWS
-   **Escalabilidad**: Millones de emails sin problemas

**Configuración Requerida**

1. Verificar dominio en SES (DNS records)
2. Salir de Sandbox (solicitar límites de producción)
3. Configurar SPF, DKIM, DMARC
4. Crear credenciales SMTP

---

### 5.4 Servicios Adicionales (Extras)

#### 5.4.1 JWT (JSON Web Tokens)

**Descripción Técnica**
Estándar abierto (RFC 7519) para transmitir información de forma segura entre partes como objetos JSON. En JobHive se usa para validar tokens de Cognito.

**Estructura del Token**

```
Header.Payload.Signature

Ejemplo:
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.
Signature-Hash
```

**Implementación en JobHive**

```javascript
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const client = jwksClient({
    jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    jwt.verify(token, getKey, {}, (err, user) => {
        if (err) return res.status(403).json({ err: "Invalid token" });
        req.user = user;
        next();
    });
};
```

**Justificación**

-   Stateless: No requiere sesiones en servidor
-   Seguro: Firmado con RS256 (clave asimétrica)
-   Estándar: Compatible con OAuth 2.0
-   Escalable: Ideal para arquitecturas distribuidas

---

#### 5.4.2 pdf-parse (Librería Node.js)

**Descripción Técnica**
Librería open-source para extraer texto de archivos PDF en Node.js. Basada en pdf.js de Mozilla.

**Implementación en JobHive**

```javascript
const pdf = require("pdf-parse");

async function extractTextFromPDF(pdfBuffer) {
    const data = await pdf(pdfBuffer);

    return {
        text: data.text, // Texto completo
        numPages: data.numpages, // Número de páginas
        info: data.info, // Metadata del PDF
    };
}
```

**Caso de Uso**

-   Extraer texto de CVs en PDF
-   Buscar habilidades en documentos
-   Analizar experiencia laboral

**Justificación**

-   Gratis y open-source
-   No requiere servicios externos
-   Rápido para PDFs de tamaño moderado

---

## 6. SEGURIDAD Y MEJORES PRÁCTICAS

### 6.1 Autenticación y Autorización

#### Medidas Implementadas

1. **Cognito User Pools**: Gestión centralizada de usuarios
2. **JWT Verification**: Validación de tokens en cada request
3. **Secret Hash**: Protección adicional del Client Secret
4. **HTTPS Only**: Todas las comunicaciones encriptadas

#### Middleware de Autenticación

```javascript
// Todas las rutas protegidas requieren JWT válido
router.get("/jobs", authenticateJWT, async (req, res) => {
    // req.user contiene datos del token verificado
});
```

### 6.2 Gestión de Secretos

**Variables de Entorno (.env)**

```env
# AWS Cognito
AWS_REGION=us-east-1
AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx

# AWS Services
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=jobhive-bucket

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=jobhive

# SES
SES_SMTP_USERNAME=AKIA...
SES_SMTP_PASSWORD=...
SES_FROM_EMAIL=noreply@jobhive.com
```

**Recomendaciones**

-   Usar AWS Secrets Manager en producción
-   Rotar credenciales periódicamente
-   No commitear .env al repositorio (incluir en .gitignore)

### 6.3 Validación de Datos

**Backend Validation**

```javascript
// Validar campos requeridos
if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ err: "Missing required fields" });
}

// Validar formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    return res.status(400).json({ err: "Invalid email format" });
}
```

### 6.4 Protección contra Ataques

#### SQL Injection

```javascript
// ✅ CORRECTO: Uso de prepared statements
await db.query("SELECT * FROM USUARIO WHERE CORREO = ?", [email]);

// ❌ INCORRECTO: Concatenación directa
await db.query(`SELECT * FROM USUARIO WHERE CORREO = '${email}'`);
```

#### XSS (Cross-Site Scripting)

-   React escapa automáticamente contenido en JSX
-   Validar HTML en backend para descripciones de empleos

#### Rate Limiting

```javascript
// Cognito maneja automáticamente limitación de intentos
// Error: LimitExceededException después de muchos intentos
```

---

## 7. ESCALABILIDAD Y RENDIMIENTO

### 7.1 Estrategias de Escalamiento

#### Horizontal Scaling

-   **Frontend**: Deploy en S3 + CloudFront (CDN global)
-   **Backend**: Load Balancer + Auto Scaling Group de instancias EC2
-   **Base de Datos**: RDS Multi-AZ + Read Replicas

#### Vertical Scaling

-   Aumentar tamaño de instancia EC2 (t3.small → t3.medium)
-   Upgrade de RDS instance class

### 7.2 Caching

**Estrategias Propuestas**

```javascript
// Redis para cachear resultados de búsqueda
const cachedJobs = await redis.get(`jobs:${userId}`);
if (cachedJobs) return JSON.parse(cachedJobs);

// CloudFront para cachear assets estáticos
// S3 con CloudFront reduce latencia global
```

### 7.3 Optimización de Consultas

**Índices en MySQL**

```sql
-- Índice en email (búsqueda frecuente)
CREATE INDEX idx_usuario_email ON USUARIO(CORREO);

-- Índice compuesto en postulaciones
CREATE INDEX idx_postulacion_usuario_empleo
ON POSTULACION(ID_USUARIO, ID_EMPLEO);
```

---

## 8. MONITOREO Y LOGGING

### 8.1 Logging en Backend

```javascript
// Console logs estructurados
console.log("[INFO] Usuario registrado:", { email, timestamp: new Date() });
console.error("[ERROR] Error en Rekognition:", error.message);
```

**Mejoras Recomendadas**

-   Winston o Bunyan para logging estructurado
-   CloudWatch Logs para centralizar logs
-   CloudWatch Alarms para alertas

### 8.2 Métricas Clave

| Métrica             | Descripción                     | Objetivo               |
| ------------------- | ------------------------------- | ---------------------- |
| **Latencia API**    | Tiempo de respuesta promedio    | <500ms                 |
| **Tasa de Errores** | Porcentaje de requests fallidos | <1%                    |
| **Uptime**          | Disponibilidad del servicio     | >99.9%                 |
| **Uso de S3**       | Almacenamiento consumido        | Monitorear costos      |
| **Cognito MAU**     | Usuarios activos mensuales      | Proyectar escalamiento |

---

## 9. DEPLOYMENT Y CI/CD

### 9.1 Proceso de Despliegue Actual

**Frontend (React)**

```bash
# Build de producción
cd Frontend
npm run build

# Deploy a S3
aws s3 sync build/ s3://jobhive-frontend --delete
aws cloudfront create-invalidation --distribution-id EXXXX --paths "/*"
```

**Backend (Node.js)**

```bash
# Deploy a EC2
ssh ec2-user@instance-ip
cd /var/www/api
git pull origin main
npm install
pm2 restart api
```

## 10. CONCLUSIONES Y RECOMENDACIONES

### 10.1 Logros del Proyecto

✅ **Arquitectura Cloud-Native**: Integración exitosa de 6+ servicios AWS
✅ **Autenticación Robusta**: Cognito con JWT para seguridad
✅ **IA Integrada**: OCR, Text-to-Speech, Traducción
✅ **Escalabilidad**: Diseño preparado para crecimiento
✅ **Costo Optimizado**: $37-$122/mes con free tier

### 10.2 Áreas de Mejora

#### Técnicas

1. **Testing**: Implementar Jest + React Testing Library
2. **Documentación API**: Swagger/OpenAPI para endpoints
3. **Error Handling**: Middleware centralizado de errores
4. **Logging**: Winston + CloudWatch Logs
5. **Caching**: Redis para reducir latencia

#### Seguridad

1. **Rate Limiting**: Express-rate-limit en rutas públicas
2. **CORS**: Configurar whitelist de dominios
3. **Helmet.js**: Headers de seguridad HTTP
4. **Input Sanitization**: Validar y sanitizar inputs

#### Funcionales

1. **Notificaciones Push**: Firebase Cloud Messaging
2. **Chat en Tiempo Real**: WebSockets para reclutador-candidato
3. **Analytics**: Google Analytics o Mixpanel
4. **A/B Testing**: Optimizar conversión de postulaciones

### 10.3 Roadmap Futuro

**Fase 1 (1-3 meses)**

-   Migrar a AWS RDS para base de datos
-   Implementar CloudFront CDN
-   Agregar tests unitarios e integración

**Fase 2 (3-6 meses)**

-   Sistema de recomendaciones con Machine Learning (SageMaker)
-   Integración con LinkedIn API
-   Dashboard de analytics para reclutadores

**Fase 3 (6-12 meses)**

-   App móvil (React Native)
-   Expansion internacional (multi-región)
-   Chatbot con Amazon Lex

---

## ANEXOS

### A. Estructura de Directorios

```
JobHive/
├── Frontend/                 # Aplicación React
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Menu/
│   │   │   ├── Panels/
│   │   │   │   ├── CVUpload.js
│   │   │   │   ├── ImageAnalyzer.js
│   │   │   │   ├── JobForm.js
│   │   │   │   └── ...
│   │   │   └── TopBar/
│   │   ├── Pages/
│   │   │   ├── Admin/
│   │   │   ├── Login/
│   │   │   ├── Signup/
│   │   │   └── User/
│   │   ├── Utils/
│   │   │   ├── Colors.css
│   │   │   └── DarkMode.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── Node/                     # Backend API
│   ├── routes/
│   │   ├── index.js
│   │   ├── users.js
│   │   ├── jobs.js
│   │   └── polly.js
│   ├── utils/
│   │   ├── analyzer.audio.js
│   │   ├── analyzer.txt.js
│   │   ├── authJWT.js
│   │   ├── db.js
│   │   ├── email.js
│   │   ├── polly.js
│   │   └── translate.text.js
│   ├── app.js
│   ├── package.json
│   └── nodemon.json
│
├── .env                      # Variables de entorno (NO commitear)
├── .gitignore
└── README.md
```

### B. Variables de Entorno Requeridas

```env
# ===========================================
# AWS COGNITO
# ===========================================
AWS_REGION=us-east-1
AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# AWS GENERAL
# ===========================================
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# ===========================================
# AWS S3
# ===========================================
AWS_BUCKET_NAME=jobhive-bucket

# ===========================================
# AWS REKOGNITION
# ===========================================
REKOGNITION_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
REKOGNITION_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
REKOGNITION_REGION=us-east-1

# ===========================================
# AWS POLLY
# ===========================================
POLLY_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
POLLY_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
POLLY_REGION=us-east-1

# ===========================================
# AWS TRANSLATE
# ===========================================
TRASLATE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
TRASLATE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
TRASLATE_REGION=us-east-1

# ===========================================
# AWS SES (Simple Email Service)
# ===========================================
SES_SMTP_USERNAME=AKIAIOSFODNN7EXAMPLE
SES_SMTP_PASSWORD=BPXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SES_FROM_EMAIL=noreply@jobhive.com

# ===========================================
# DATABASE (MySQL)
# ===========================================
DB_HOST=localhost
DB_USER=root
DB_PASS=mysecurepassword
DB_NAME=jobhive_db

# ===========================================
# API CONFIG
# ===========================================
API_HOST=0.0.0.0
API_PORT=3001
NODE_ENV=production

# ===========================================
# FRONTEND (React)
# ===========================================
REACT_APP_API_URL=http://localhost:3001
```

### C. Comandos Útiles

```bash
# ===== FRONTEND =====
cd Frontend
npm install              # Instalar dependencias
npm start                # Desarrollo (puerto 3000)
npm run build            # Build de producción
npm test                 # Ejecutar tests

# ===== BACKEND =====
cd Node
npm install              # Instalar dependencias
npm start                # Producción
npm run dev              # Desarrollo con nodemon

# ===== DOCKER (opcional) =====
docker-compose up -d     # Levantar servicios
docker-compose down      # Detener servicios

# ===== AWS CLI =====
aws s3 ls                                    # Listar buckets
aws cognito-idp list-users --user-pool-id <ID>  # Listar usuarios
aws rekognition detect-text --image-bytes <file> # Test OCR
```

### D. Referencias y Documentación

**AWS Documentation**

-   Cognito: https://docs.aws.amazon.com/cognito/
-   S3: https://docs.aws.amazon.com/s3/
-   Rekognition: https://docs.aws.amazon.com/rekognition/
-   Polly: https://docs.aws.amazon.com/polly/
-   Translate: https://docs.aws.amazon.com/translate/
-   SES: https://docs.aws.amazon.com/ses/

**Librerías Node.js**

-   Express: https://expressjs.com/
-   mysql2: https://github.com/sidorares/node-mysql2
-   jsonwebtoken: https://github.com/auth0/node-jsonwebtoken
-   nodemailer: https://nodemailer.com/

**Frontend**

-   React: https://react.dev/
-   React Router: https://reactrouter.com/

---



