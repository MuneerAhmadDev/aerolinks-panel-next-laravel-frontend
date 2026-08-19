import api from "@/api/api";
import Cookies from 'js-cookie';

export const checkAuth = async () => {
  try {
    const token = Cookies.get('token');
    if (token) {
      const response = await api.get('api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("User is not authenticated", error);
    return null;
  }
};
export const logout = async () => {
  try {
    const token = Cookies.get('token');
    if (token) {
      const response = await api.get('api/logout', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("User is not authenticated", error);
    return null;
  }
};
// export const logout = async () => {
//   try {
//     const token = Cookies.get('token');
//     if (token) {
//       await api.get('api/logout', null, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         });
//         Cookies.remove('token');
//         return true;
//     }
//     return false;
//     }
//     catch (error) {
//       console.error("User is not authenticated", error);
//       return false;
//     }
// }