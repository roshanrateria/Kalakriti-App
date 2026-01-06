/**
 * Cloud SQL Connector for Prisma
 * This file handles the connection to Cloud SQL from Cloud Run using the official connector
 */

import { Connector } from '@google-cloud/cloud-sql-connector';
import * as pg from 'pg';

let connectorInstance: Connector | null = null;
let pool: pg.Pool | null = null;

/**
 * Initialize Cloud SQL connector for Cloud Run environment
 * Uses Unix socket connection when available, falls back to TCP for local development
 */
export async function initializeCloudSqlConnector(): Promise<void> {
  // Only initialize in production or when explicitly using Cloud SQL
  if (process.env.NODE_ENV !== 'production' && !process.env.USE_CLOUD_SQL_CONNECTOR) {
    return;
  }

  try {
    // In Cloud Run, use the Cloud SQL Connector
    if (process.env.INSTANCE_CONNECTION_NAME && !connectorInstance) {
      console.log('Initializing Cloud SQL Connector for Cloud Run...');
      
      connectorInstance = new Connector();

      // Get a socket based on current environment
      const clientOpts = await connectorInstance.getOptions({
        instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME!,
        authType: 'IAM',
      });

      pool = new pg.Pool({
        ...clientOpts,
        user: process.env.DB_USER || process.env.DATABASE_URL?.match(/postgres:([^:]+)/)?.[1] || 'postgres',
        password: process.env.DB_PASS || process.env.DATABASE_URL?.match(/:([^@]+)@/)?.[1],
        database: process.env.DB_NAME || 'kalakriti-products',
        max: 5,
      });

      console.log('✓ Cloud SQL Connector initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Cloud SQL Connector:', error);
    throw error;
  }
}

/**
 * Close the Cloud SQL connector connection
 */
export async function closeCloudSqlConnector(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }

  if (connectorInstance) {
    await connectorInstance.close();
    connectorInstance = null;
  }
}

/**
 * Get the database pool for direct queries if needed
 */
export function getPool(): pg.Pool | null {
  return pool;
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (pool) {
      const result = await pool.query('SELECT NOW()');
      return !!result.rows;
    }
    return false;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
