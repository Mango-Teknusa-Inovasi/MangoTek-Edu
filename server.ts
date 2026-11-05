import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from './server/app';
serve({fetch:app.fetch,port:Number(process.env.PORT||3000),hostname:process.env.HOST||'127.0.0.1'},({port})=>console.log(`MangoTek Edu tersedia di http://localhost:${port}`));
