export interface ResponseElectron {
  status: 'success' | 'error' | 'info';
  message: string;
}
