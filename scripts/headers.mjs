import {writeFileSync,mkdirSync} from 'node:fs';
import {loadEnv} from 'vite';
const env=loadEnv('production',process.cwd(),'VITE_');
const api=process.env.VITE_API_URL||env.VITE_API_URL||'/api';
const origin=api.startsWith('/') ? '' : new URL(api).origin;
if(origin && !origin.startsWith('https://')) throw new Error('Production VITE_API_URL must use HTTPS, or use relative /api');
const patient=process.cwd().endsWith('patient-website') || JSON.parse((await import('node:fs')).readFileSync('package.json')).name.includes('patient');
const csp=["default-src 'self'","base-uri 'self'","object-src 'none'","frame-ancestors 'none'","form-action 'self'","font-src 'self'","style-src 'self' 'unsafe-inline'","img-src 'self' data: blob: https:","script-src 'self'"+(patient?' https://checkout.razorpay.com':''),"connect-src 'self'"+(origin?' '+origin:'')+(patient?' https://*.razorpay.com https://*.razorpay.in':''),"frame-src "+(patient?"https://*.razorpay.com https://*.razorpay.in":"'none'")].join('; ');
const headers={'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Strict-Transport-Security':'max-age=31536000'};
mkdirSync('public',{recursive:true});
writeFileSync('public/_headers','/*\n'+Object.entries(headers).map(([k,v])=>'  '+k+': '+v).join('\n')+'\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
writeFileSync('vercel.json',JSON.stringify({headers:[{source:'/(.*)',headers:Object.entries(headers).map(([key,value])=>({key,value}))}],rewrites:[{source:'/((?!api/).*)',destination:'/index.html'}]},null,2)+'\n');
writeFileSync('nginx.conf',`server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  ${Object.entries(headers).map(([k,v])=>'add_header '+k+' "'+v+'" always;').join('\n  ')}
  location ~ /\\. { deny all; }
  location / { try_files $uri $uri/ /index.html; }
  location /api/ {
    proxy_pass http://backend:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 8m;
  }
  location /assets/ { try_files $uri =404; expires 1y; }
}
`);
