export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
    }
  },
  clear: (): void => {
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn('localStorage.clear failed:', e);
    }
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn('sessionStorage.getItem failed:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('sessionStorage.setItem failed:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('sessionStorage.removeItem failed:', e);
    }
  },
  clear: (): void => {
    try {
      window.sessionStorage.clear();
    } catch (e) {
      console.warn('sessionStorage.clear failed:', e);
    }
  }
};
