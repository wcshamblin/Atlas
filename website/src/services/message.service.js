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


export const postPoint = async (accessToken, map_id, point) => {
    const config = {
        url: `${apiServerUrl}/maps/${map_id}/points`,
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

export const putPoint = async (accessToken, map_id, point_id, point) => {
    const config = {
        url: `${apiServerUrl}/maps/${map_id}/points/${point_id}`,
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

export const deletePoint = async (accessToken, map_id, point_id) => {
    const config = {
        url: `${apiServerUrl}/maps/${map_id}/points/${point_id}`,
        method: "DELETE",
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

export const putMapInfo = async (accessToken, map_id, map) => {
    const config = {
        url: `${apiServerUrl}/maps/${map_id}/info`,
        method: "PUT",
        headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
        data: map
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
}

export const deleteMap = async (accessToken, map_id) => {
    const config = {
        url: `${apiServerUrl}/maps/${map_id}`,
        method: "DELETE",
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

export const setHome = async (accessToken, lat, lng) => {
    const config = {
        url: `${apiServerUrl}/set_home`,
        method: "POST",
        headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
        data: {
            "lat": lat,
            "lng": lng
        }
    };

    console.log(config);

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
}

export const retrieveHome = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/home`,
        method: "GET",
        headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    console.log(config);

    return {
        data: data || null,
        error,
    };
}

export const retrieveEulaAcceptance = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/eula`,
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
    }
}

export const acceptEula = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/eula`,
        method: "POST",
        headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    }
}

export const retrieveTowers = async (accessToken, lat, lng, radius) => {
    const config = {
        url: `${apiServerUrl}/fcc/towers/nearby/${lat}/${lng}/${radius}`,
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
    }
}

export const retrieveObstacles = async (accessToken, lat, lng, radius, minheight, maxheight) => {
    const config = {
        url: `${apiServerUrl}/faa/obstacles/nearby/${lat}/${lng}/${radius}/${minheight}/${maxheight}`,
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
    }
}

export const retrieveAntennas = async (accessToken, lat, lng, radius, uls) => {
    const config = {
        url: `${apiServerUrl}/fcc/antennas/nearby/${lat}/${lng}/${radius}/${uls}`,
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
    }
}

export const fetchMaps = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/maps`,
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
    }
}

export const postNewMap = async (accessToken, newMap) => {
    const config = {
        url: `${apiServerUrl}/maps`,
        method: "POST",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        data: newMap
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    }
}

export const putMapUser = async (accessToken, map_id, userSub) => {
    const config = {
        url: `${apiServerUrl}/maps/${map_id}/users`,
        method: "POST",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        data: userSub
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    }
}

export const putMapUserPermissions = async (accessToken, map_id, user_id, permissions) => {
    const config = {
        url: `${apiServerUrl}/maps/${map_id}/users/${user_id}`,
        method: "PUT",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        data: permissions
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    }
}

export const retrieveCustomMapPoints = async (accessToken, mapId) => {
    const config = {
        url: `${apiServerUrl}/maps/${mapId}/points`,
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
    }
}

export const editMapInfo = async (accessToken, method, mapId, infoType, data) => {
    const config = {
        url: `${apiServerUrl}/maps/${mapId}/${infoType}`,
        method: method,
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        data: data
    };

    const { dataResponse, error } = await callExternalApi({ config });

    return {
        data: dataResponse || null,
        error,
    };
}

// no auth
export const retrieveAstronomyData = async (tzdiff, date, lat, lng) => {
    const config = {
        url: `${apiServerUrl}/astronomy/${tzdiff}/${date}/${lat}/${lng}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
        },
    };

    const { data, error } = await callExternalApi({ config });
    console.log("astronomy", data);

    return {
        data: data || null,
        error,
    }
}