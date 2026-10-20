import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:5186,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:3006',changeOrigin:false},'/socket.io':{target:'http://127.0.0.1:3006',ws:true,changeOrigin:false}}}});
