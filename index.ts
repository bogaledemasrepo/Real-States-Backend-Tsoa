import { app } from "./app";
app.listen(process.env.PORT||8000, () => console.log(`🚀 Server at ${process.env.PROD_API_URL||'http://localhost:8000'}/docs`));