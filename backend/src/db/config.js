import mongoose from 'mongoose';
import { DB_NAME } from '../constants/index.js';

/**
 * Resolves mongodb+srv URI via DNS-over-HTTPS if standard DNS SRV fails (e.g. on restricted networks/firewalls)
 */
async function resolveSrvViaDoH(srvUri) {
  try {
    const match = srvUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/.*)?$/);
    if (!match) return srvUri;
    const [, user, pass, hostname, rest = ''] = match;

    const srvRes = await fetch(`https://dns.google/resolve?name=_mongodb._tcp.${hostname}&type=SRV`).then(r => r.json());
    if (!srvRes.Answer || srvRes.Answer.length === 0) return srvUri;

    const hosts = srvRes.Answer.map(ans => {
      const parts = ans.data.split(' ');
      const port = parts[2] || '27017';
      const host = (parts[3] || '').replace(/\.$/, '');
      return `${host}:${port}`;
    }).join(',');

    let extraParams = 'ssl=true&authSource=admin&retryWrites=true&w=majority';
    try {
      const txtRes = await fetch(`https://dns.google/resolve?name=${hostname}&type=TXT`).then(r => r.json());
      if (txtRes.Answer && txtRes.Answer[0]) {
        const txtData = txtRes.Answer[0].data.replace(/^"|"$/g, '');
        extraParams = `ssl=true&${txtData}&retryWrites=true&w=majority`;
      }
    } catch (_) {}

    const delimiter = rest.includes('?') ? '&' : '?';
    const cleanRest = rest ? (rest.startsWith('/') ? rest : `/${rest}`) : '/';
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hosts}${cleanRest}${delimiter}${extraParams}`;
  } catch (e) {
    return srvUri;
  }
}

const connectDB = async () => {
  let uri = process.env.MONGO_URI;
  try {
    const connectionInstance = await mongoose.connect(uri, {
      dbName: DB_NAME,
    });
    console.log(
      `MongoDB connected: ${connectionInstance.connection.host}/${DB_NAME}`
    );
  } catch (error) {
    if (uri && uri.startsWith('mongodb+srv://')) {
      console.warn('Direct SRV resolution failed. Attempting DNS-over-HTTPS fallback resolution...');
      try {
        const resolvedUri = await resolveSrvViaDoH(uri);
        const connectionInstance = await mongoose.connect(resolvedUri, {
          dbName: DB_NAME,
        });
        console.log(
          `MongoDB connected via DoH fallback: ${connectionInstance.connection.host}/${DB_NAME}`
        );
        return;
      } catch (fallbackError) {
        console.error('MongoDB fallback connection error:', fallbackError.message);
      }
    }
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
