import { callExternalApi } from "./external-api.service";

const apiServerUrl = process.env.REACT_APP_API_SERVER_URL;

export const getPublicResource = async () => {
  const config = {
    url: `${apiServerUrl}/api/messages/public`,
    method: "GET",
    headers: {
      "content-type": "application/json",
    },
  };

  const { data, error } = await callExternalApi({ config });

  return {
    data: data || null,
    error,
  };
};

export const getProtectedResource = async (accessToken) => {
  const config = {
    url: `${apiServerUrl}/api/messages/protected`,
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const { data, error } = await callExternalApi({ config });

  return {
    data: data || null,
    error,
  };
};

export const getAdminResource = async (accessToken) => {
  const config = {
    url: `${apiServerUrl}/api/messages/admin`,
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const { data, error } = await callExternalApi({ config });

  return {
    data: data || null,
    error,
  };
};

export const fetchPoints = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/points`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
}

export const postPoint = async (accessToken, point) => {
    const config = {
        url: `${apiServerUrl}/points`,
        method: "POST",
        headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
        data: point
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
}

export const putPoint = async (accessToken, point) => {
    const config = {
        url: `${apiServerUrl}/points/${point.id}`,
        method: "PUT",
        headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
        data: point
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
}