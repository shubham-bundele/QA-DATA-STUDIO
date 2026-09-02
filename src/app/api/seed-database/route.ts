import { NextResponse } from 'next/server';
// Use dynamic imports to prevent build failures if pg/mysql2 aren't installed correctly locally, 
// though we installed them in the step before.
import { Pool } from 'pg';
import mysql from 'mysql2/promise';

export async function POST(req: Request) {
  try {
    const { 
      connectionString, 
      dbType, 
      tableName, 
      count,
      columns 
    } = await req.json();

    if (!connectionString || !tableName || !columns || columns.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // A mock data generator function (since we can't easily import the complex frontend generators here)
    const generateRow = (cols: { name: string, type: string }[]) => {
      const row: any = {};
      for (const col of cols) {
        if (col.type === 'uuid') row[col.name] = crypto.randomUUID();
        else if (col.type === 'name') row[col.name] = `User_${Math.floor(Math.random()*10000)}`;
        else if (col.type === 'email') row[col.name] = `test${Math.floor(Math.random()*10000)}@example.com`;
        else if (col.type === 'number') row[col.name] = Math.floor(Math.random() * 100);
        else if (col.type === 'boolean') row[col.name] = Math.random() > 0.5;
        else row[col.name] = `Data_${Math.floor(Math.random()*100)}`;
      }
      return row;
    };

    let inserted = 0;

    if (dbType === 'postgres') {
      const pool = new Pool({ connectionString });
      const client = await pool.connect();
      try {
        for (let i = 0; i < count; i++) {
          const row = generateRow(columns);
          const keys = Object.keys(row);
          const values = Object.values(row);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
          await client.query(query, values);
          inserted++;
        }
      } finally {
        client.release();
        await pool.end();
      }
    } else if (dbType === 'mysql') {
      const connection = await mysql.createConnection(connectionString);
      try {
        for (let i = 0; i < count; i++) {
          const row = generateRow(columns);
          const keys = Object.keys(row);
          const values = Object.values(row);
          const placeholders = keys.map(() => '?').join(', ');
          
          const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
          await connection.execute(query, values as any[]);
          inserted++;
        }
      } finally {
        await connection.end();
      }
    } else {
       return NextResponse.json({ error: "Unsupported database type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, inserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
