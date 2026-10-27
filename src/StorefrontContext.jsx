import { createContext, useContext } from 'react';
export const StorefrontContext = createContext(null);
export const useStorefront = () => useContext(StorefrontContext);
