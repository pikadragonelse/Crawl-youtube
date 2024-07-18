import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

axios.defaults.baseURL = process.env.END_POINT;
const apiInstance = axios.create();
export { apiInstance };
