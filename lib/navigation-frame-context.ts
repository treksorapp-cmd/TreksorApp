import { createContext, useContext } from 'react';
export const FixedRouteContext = createContext(false);
export const useFixedRouteHeader = () => useContext(FixedRouteContext);
