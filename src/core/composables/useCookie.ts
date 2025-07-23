import { ref, watch } from "vue";

interface UseCookieOptions<T> {
  defaultValue: T;
  expires?: Date | number; // 일수 또는 Date 객체
  fallbackToLocalStorage?: boolean;
  path?: string;
}

export function useCookie<T = string>(
  key: string,
  options: UseCookieOptions<T>
) {
  const {
    defaultValue,
    expires,
    fallbackToLocalStorage = false,
    path = "/",
  } = options;

  // 초기값 결정
  const getInitialValue = (): T => {
    const cookieMatch = document.cookie.match(
      new RegExp("(^| )" + key + "=([^;]+)")
    );
    if (cookieMatch) {
      try {
        return JSON.parse(decodeURIComponent(cookieMatch[2]));
      } catch {
        return cookieMatch[2] as unknown as T;
      }
    }

    if (fallbackToLocalStorage) {
      const local = localStorage.getItem(key);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          return local as unknown as T;
        }
      }
    }

    return defaultValue;
  };

  // 쿠키 제거 함수
  const remove = () => {
    document.cookie = `${key}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    if (fallbackToLocalStorage) {
      localStorage.removeItem(key);
    }
  };

  const value = ref<T>(getInitialValue());

  // 쿠키 & localStorage 동기화
  watch(
    value,
    (val) => {
      const serialized = encodeURIComponent(JSON.stringify(val));
      let cookieStr = `${key}=${serialized}; path=${path};`;

      if (expires) {
        const expDate =
          typeof expires === "number"
            ? new Date(Date.now() + expires * 864e5)
            : expires;
        cookieStr += ` expires=${expDate.toUTCString()};`;
      }

      document.cookie = cookieStr;

      if (fallbackToLocalStorage) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    },
    { immediate: true }
  );

  return { value, remove };
}
