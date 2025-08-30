import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

/**
 * Custom hook for localStorage with TypeScript support and error handling
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes to this key from other windows/tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for managing localStorage with automatic cleanup
 */
export function useTemporaryStorage<T>(
  key: string,
  initialValue: T,
  expirationMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): [T, (value: SetValue<T>) => void, () => void] {
  const [value, setValue] = useLocalStorage(key, initialValue);

  // Check if stored value has expired
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const timestampKey = `${key}_timestamp`;
      const timestamp = window.localStorage.getItem(timestampKey);
      
      if (timestamp) {
        const storedTime = parseInt(timestamp, 10);
        const now = Date.now();
        
        if (now - storedTime > expirationMs) {
          // Value has expired, clear it
          window.localStorage.removeItem(key);
          window.localStorage.removeItem(timestampKey);
          setValue(initialValue);
        }
      } else if (value !== initialValue) {
        // No timestamp but has value, set timestamp
        window.localStorage.setItem(timestampKey, Date.now().toString());
      }
    } catch (error) {
      console.warn(`Error checking expiration for localStorage key "${key}":`, error);
    }
  }, [key, value, initialValue, expirationMs, setValue]);

  // Enhanced setValue that also sets timestamp
  const setValueWithTimestamp = useCallback((newValue: SetValue<T>) => {
    setValue(newValue);
    
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`${key}_timestamp`, Date.now().toString());
      } catch (error) {
        console.warn(`Error setting timestamp for localStorage key "${key}":`, error);
      }
    }
  }, [key, setValue]);

  // Clear function
  const clearValue = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(`${key}_timestamp`);
      } catch (error) {
        console.warn(`Error clearing localStorage key "${key}":`, error);
      }
    }
    setValue(initialValue);
  }, [key, initialValue, setValue]);

  return [value, setValueWithTimestamp, clearValue];
}

/**
 * Hook for localStorage with size limits and automatic cleanup
 */
export function useBoundedStorage<T>(
  key: string,
  initialValue: T,
  maxSizeBytes: number = 50000 // 50KB default
): [T, (value: SetValue<T>) => void, number] {
  const [value, setValue] = useLocalStorage(key, initialValue);
  const [currentSize, setCurrentSize] = useState(0);

  // Calculate size of stored value
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        setCurrentSize(item ? new Blob([item]).size : 0);
      } catch (error) {
        setCurrentSize(0);
      }
    }
  }, [key, value]);

  // Enhanced setValue with size checking
  const setBoundedValue = useCallback((newValue: SetValue<T>) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      const serialized = JSON.stringify(valueToStore);
      const size = new Blob([serialized]).size;
      
      if (size <= maxSizeBytes) {
        setValue(valueToStore);
      } else {
        console.warn(`Cannot store value for key "${key}": size ${size} exceeds limit ${maxSizeBytes}`);
        
        // If it's an array, try to remove oldest items
        if (Array.isArray(valueToStore) && valueToStore.length > 1) {
          const truncatedArray = valueToStore.slice(-Math.floor(valueToStore.length / 2));
          const truncatedSize = new Blob([JSON.stringify(truncatedArray)]).size;
          
          if (truncatedSize <= maxSizeBytes) {
            setValue(truncatedArray as T);
            console.warn(`Truncated array to fit size limit for key "${key}"`);
          }
        }
      }
    } catch (error) {
      console.warn(`Error setting bounded localStorage value for key "${key}":`, error);
    }
  }, [key, value, maxSizeBytes, setValue]);

  return [value, setBoundedValue, currentSize];
}

/**
 * Hook for managing multiple related localStorage keys with a prefix
 */
export function usePrefixedStorage(prefix: string) {
  const getItem = useCallback(<T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(`${prefix}_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading prefixed localStorage key "${prefix}_${key}":`, error);
      return defaultValue;
    }
  }, [prefix]);

  const setItem = useCallback(<T>(key: string, value: T): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(`${prefix}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting prefixed localStorage key "${prefix}_${key}":`, error);
    }
  }, [prefix]);

  const removeItem = useCallback((key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(`${prefix}_${key}`);
    } catch (error) {
      console.warn(`Error removing prefixed localStorage key "${prefix}_${key}":`, error);
    }
  }, [prefix]);

  const clearAll = useCallback((): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(`${prefix}_`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    } catch (error) {
      console.warn(`Error clearing prefixed localStorage keys with prefix "${prefix}":`, error);
    }
  }, [prefix]);

  const getAllKeys = useCallback((): string[] => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(`${prefix}_`)) {
          keys.push(key.substring(`${prefix}_`.length));
        }
      }
      return keys;
    } catch (error) {
      console.warn(`Error getting prefixed localStorage keys with prefix "${prefix}":`, error);
      return [];
    }
  }, [prefix]);

  return {
    getItem,
    setItem,
    removeItem,
    clearAll,
    getAllKeys,
  };
}

export default useLocalStorage;