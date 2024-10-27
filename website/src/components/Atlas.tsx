import React, { useMemo, useState, useEffect, useRef, createContext, type ReactElement, type Ref, type RefObject, useContext } from 'react';
// css
import 'styles/components/map.css';
import 'styles/components/sidebar.css';
import 'styles/components/layerswitcher.css'
import 'styles/components/rightclickpopup.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-datetime-picker/dist/DateTimePicker.css';

import Map, { useMap, type ViewState } from 'react-map-gl/maplibre';
import Sidebar from 'components/sidebar/NewSidebar';
import { AtlasContext } from 'providers/AtlasContext';
import type { StyleSpecification } from 'maplibre-gl';

import * as utils from 'helpers/data-utils';
import { retrieveObstacles, retrieveTowers, retrieveAntennas } from 'services/message.service';
import { SettingsContext } from 'providers/SettingsContext';
import type { ViewStateChangeEvent } from 'react-map-gl/maplibre';
import { useAuth0 } from '@auth0/auth0-react';

const Atlas = () => {
    const { atlas } = useMap();
    const { getAccessTokenSilently } = useAuth0();
    const { hideLabels, isoMinutes, isoProfile, showUls } = useContext(SettingsContext);
    const [displaySidebar, setDisplaySidebar] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [viewState, setViewState] = useState<ViewState>({
        longitude: -100,
        latitude: 40,
        zoom: 3.5,
        bearing: 0,
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const [baseStyle, setBaseStyle] = useState<string>(utils.getDefaultMapStyle());
    const memoizedBaseStyle: StyleSpecification = useMemo(() => {
        // whenever baseStyle or hideLabels updates, regenerate the stylespecification
        localStorage.setItem('base-style', baseStyle);
        return utils.getUpdatedMapStyle(baseStyle, hideLabels);
    }, [baseStyle, hideLabels]);

    const [selectedCats, setSelectedCats] = useState<[string, string[]?, any?][]>(utils.getStoredRegularLayers());
    const memoizedCats: ReactElement[] | undefined = useMemo(() => {
        localStorage.setItem('selected-cats', JSON.stringify(selectedCats))
        if (selectedCats && selectedCats.length > 0) {
            return selectedCats.map(cat => {
                if (cat[1] || cat[2]) {
                    return utils.customCategoryElements(cat[0], cat[1], cat[2]);
                } else {
                    return utils.categoryElements[cat[0]];
                }
            });
        } else {
            return undefined;
        }
    }, [selectedCats]);

    const loadIsoData = () => {
        const isoUrl = utils.getIsoUrl(41.47746701561283, -81.6652067043115, isoMinutes, isoProfile);

        utils.getIso(isoUrl).then(data => {
            setSelectedCats((oldCats) => {
                return oldCats.map(cat => {
                    if (cat[0] === 'Isochrone') {
                        cat[2] = data;
                    }
                    return cat;
                })
            });
        });
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            loadIsoData();
        }, 100)

        return () => clearTimeout(timer)
    }, [isoMinutes, isoProfile])

    useEffect(() => {
        selectedCats.forEach(([catId, , customParameter]) => {
            if(!customParameter) {
                switch (catId) {
                    case 'Isochrone':
                        loadIsoData()
                        break;
                    case 'All Towers':
                        loadTowers(viewState);
                        break;
                    case 'FAA Obstacles':
                        loadObstacles(viewState);
                        break;
                    case 'Antennas':
                        loadAntennas(viewState);
                        break;
                    default:
                        break;
                }
            }
        })
    }, [selectedCats])

    const updateLayersAfterMove = (e: ViewStateChangeEvent) => {
        loadTowers(e.viewState);
        loadObstacles(e.viewState);
        loadAntennas(e.viewState);
    }

    const loadTowers = async (viewState: ViewState) => {
        const accessToken = await getAccessTokenSilently();
        await retrieveTowers(accessToken, viewState.latitude, viewState.longitude, utils.towerSearchRadius).then(
            (response) => {
                if (response.data) {
                    setSelectedCats((oldCats) => {
                        return oldCats.map(cat => {
                            if (cat[0] === 'All Towers') {
                                cat[2] = {
                                    "allTowersPoints": response.data.towers_points,
                                    "allTowersPolygons": response.data.towers_polygons
                                }
                            }
                            return cat;
                        })
                    });
                }
            }
        )
    }

    const loadObstacles = async (viewState: ViewState) => {
        const accessToken = await getAccessTokenSilently();
        await retrieveObstacles(accessToken, viewState.latitude, viewState.longitude, utils.towerSearchRadius).then(
            (response) => {
                if (response.data && response.data.obstacles) {
                    setSelectedCats((oldCats) => {
                        return oldCats.map(cat => {
                            if (cat[0] === 'FAA Obstacles') {
                                cat[2] = response.data.obstacles;
                            }
                            return cat;
                        })
                    });
                }
            }
        )
    }

    const loadAntennas = async (viewState: ViewState) => {
        const accessToken = await getAccessTokenSilently();
        await retrieveAntennas(accessToken, viewState.latitude, viewState.longitude, utils.antennaSearchRadius, showUls).then(
            (response) => {
                if (response.data && response.data.antennas) {
                    setSelectedCats((oldCats) => {
                        return oldCats.map(cat => {
                            if (cat[0] === 'Antennas') {
                                cat[2] = response.data.antennas;
                            }
                            return cat;
                        })
                    });
                }
            }
        )
    }

    const toggleCat = (catId: string, subLayers?: string[]) => {
        if(selectedCats.map(cat => cat[0]).includes(catId)) {
            setSelectedCats([...selectedCats.filter(cat => cat[0] !== catId)]);
        } else {
            setSelectedCats([...selectedCats, [catId, subLayers ?? null]]);
        }
    }
    
    const toggleSubLayer = (catId: string, subLayerId: string) => {
        const filteredCatIdx = selectedCats.findIndex(cat => cat[0] === catId);
        const filteredCat = selectedCats[filteredCatIdx];
        if (filteredCatIdx !== -1 && filteredCat[1]) {
            const newCats = [...selectedCats];
            if (filteredCat[1].includes(subLayerId)) {
                // if there is only one sublayer and thats the one we are clicking, remove the cat
                if (filteredCat[1].length === 1) return toggleCat(catId, []);
                // if there is other ones enabled, remove this one
                newCats[filteredCatIdx][1] = [...newCats[filteredCatIdx][1].filter(sl => sl !== subLayerId)];
            } else {
                newCats[filteredCatIdx][1] = [...newCats[filteredCatIdx][1], subLayerId];
            }
            setSelectedCats(newCats);
        }
    }

    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                if (displaySidebar) {
                    setDisplaySidebar(false);
                    return;
                }
            }
        }
        window.addEventListener('keydown', handleKeydown);

        return () => {
            window.removeEventListener('keydown', handleKeydown);
        }
    }, [displaySidebar]);

    const testLoadFunc = () => {
        // atlas.addControl()
        // setIsLoading(false);
    }

    return (
        <AtlasContext.Provider
            value={{
                baseStyleSpecification: memoizedBaseStyle,
                setBaseStyle,
                selectedCats,
                toggleCat,
                toggleSubLayer,
            }}
        >
            <Map
                id='atlas'
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                // needs to have a transition for the opacity
                style={{ width: '100%', height: '90vh', opacity: '100%' }}
                mapStyle={memoizedBaseStyle}
                reuseMaps
                // onRender={loadStoredLayers}
                // onData={loadStoredLayers}
                onStyleData={testLoadFunc}
                onMoveEnd={updateLayersAfterMove}
            >
                {memoizedCats != undefined && memoizedCats}
            </Map>
            <Sidebar
                expanded={displaySidebar}
                setDisplaySidebar={setDisplaySidebar}
            />
        </AtlasContext.Provider>
    );
}

export default Atlas;