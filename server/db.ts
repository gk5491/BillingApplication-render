import mssql from "mssql";

const databaseServerRaw = process.env.DATABASE_SERVER || "LAPTOP-4M368TIF\\SQLEXPRESS";
const databaseName = process.env.DATABASE_NAME || "billing_application";
const databaseInstance =
  process.env.DATABASE_INSTANCE || (databaseServerRaw.includes("\\") ? databaseServerRaw.split("\\")[1] : undefined);
const databasePort = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined;
const databaseServerHost = databaseServerRaw.includes("\\") ? databaseServerRaw.split("\\")[0] : databaseServerRaw;
const databaseServer = databaseServerHost === "." || databaseServerHost.toLowerCase() === "(local)" ? "localhost" : databaseServerHost;
const databaseEncrypt = (process.env.DATABASE_ENCRYPT || "true").toLowerCase() === "true";
const trustServerCertificate = (process.env.DATABASE_TRUST_SERVER_CERTIFICATE || "true").toLowerCase() === "true";

const buildConfig = (server: string): mssql.config => {
  const config: mssql.config = {
    server: server,
    database: databaseName,
    options: {
      encrypt: databaseEncrypt,
      trustServerCertificate: trustServerCertificate,
      instanceName: databaseInstance,
    },
  };

  if (databasePort) {
    config.port = databasePort;
  }

  // IMPORTANT: For standard mssql, SQL Server Authentication is strongly recommended
  // Set DATABASE_USER and DATABASE_PASSWORD in your .env
  if (process.env.DATABASE_USER) {
    config.user = process.env.DATABASE_USER;
    config.password = process.env.DATABASE_PASSWORD || "";
  } else {
    // If no user provided, standard mssql will attempt to connect without credentials
    // which may fail unless you have specific setup or use connection strings.
    console.warn("No DATABASE_USER provided. Connecting with standard mssql (tedious) usually requires SQL Server Authentication.");
  }

  // If a full connection string is provided in env (e.g., Azure SQL URL format), prefer it
  // But mssql.connect(string) works directly. For config object, we keep it as is.
  return config;
};

async function connectWithFallback() {
  // If DATABASE_URL is provided, use it directly (useful for Render/Render-hosted DBs)
  if (process.env.DATABASE_URL) {
    try {
      console.log("Connecting using DATABASE_URL...");
      // Filter out unsupported URL params for standard mssql if necessary,
      // but mssql usually handles basic SQL server connection strings well.
      return await mssql.connect(process.env.DATABASE_URL);
    } catch (err: any) {
      console.error("Failed to connect using DATABASE_URL:");
      console.dir(err, { depth: null });
      throw err;
    }
  }

  const hosts = [databaseServer, "localhost", "127.0.0.1"].filter((v, i, arr) => arr.indexOf(v) === i);
  let lastError: unknown;

  for (const host of hosts) {
    try {
      const config = buildConfig(host);
      console.log(`Trying to connect to MSSQL host: ${host}, database: ${databaseName}, user: ${config.user || 'none'}`);
      return await mssql.connect(config);
    } catch (err: any) {
      console.error(`Failed to connect with host ${host}:`);
      console.dir(err, { depth: null });
      lastError = err;
    }
  }

  throw lastError;
}

async function ensureDeliveryChallanSchema() {
  const p = await getPool();
  await p.request().batch(`
    IF COL_LENGTH('delivery_challans', 'subtotal') IS NULL
      ALTER TABLE delivery_challans ADD subtotal DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challans_subtotal DEFAULT 0;

    IF COL_LENGTH('delivery_challans', 'tax_amount') IS NULL
      ALTER TABLE delivery_challans ADD tax_amount DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challans_tax_amount DEFAULT 0;

    IF COL_LENGTH('delivery_challans', 'total') IS NULL
      ALTER TABLE delivery_challans ADD total DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challans_total DEFAULT 0;

    IF COL_LENGTH('delivery_challan_items', 'rate') IS NULL
      ALTER TABLE delivery_challan_items ADD rate DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challan_items_rate DEFAULT 0;

    IF COL_LENGTH('delivery_challan_items', 'tax_rate_id') IS NULL
      ALTER TABLE delivery_challan_items ADD tax_rate_id UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('delivery_challan_items', 'tax_amount') IS NULL
      ALTER TABLE delivery_challan_items ADD tax_amount DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challan_items_tax_amount DEFAULT 0;

    IF COL_LENGTH('delivery_challan_items', 'amount') IS NULL
      ALTER TABLE delivery_challan_items ADD amount DECIMAL(18, 2) NOT NULL CONSTRAINT DF_delivery_challan_items_amount DEFAULT 0;
  `);
}

let pool: any;

export async function getPool() {
  if (!pool) {
    pool = await connectWithFallback();
  }
  return pool;
}

export async function getDb() {
  if (!pool) {
    throw new Error("MSSQL pool is not initialized yet");
  }
  return pool;
}

export async function initializeDb() {
  try {
    await getPool();
    await ensureDeliveryChallanSchema();
    console.log("Connected to MSSQL database:", databaseName);
    return true;
  } catch (err) {
    console.error("CRITICAL: Failed to connect to MSSQL database during initialization:");
    console.dir(err, { depth: null });
    throw err;
  }
}

export const db = {
  get pool() {
    return pool;
  },
  async request() {
    const p = await getPool();
    return p.request();
  },
  async query(strings: TemplateStringsArray, ...values: any[]) {
    const p = await getPool();
    const request = p.request();
    let queryArgs = "";
    strings.forEach((str, i) => {
      queryArgs += str;
      if (i < values.length) {
        request.input(`param${i}`, values[i]);
        queryArgs += `@param${i}`;
      }
    });
    return request.query(queryArgs);
  }
};
