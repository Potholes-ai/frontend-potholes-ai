import { Icon } from "leaflet";
import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { io } from "socket.io-client";

import "./map.css";

interface Props {}

interface Pothole {
  _id: string;
  latitude: number;
  longitude: number;
  image?: string;
}

interface Detector {
  _id: string;
  name?: string;
  currentPosition: {
    latitude: number;
    longitude: number;
  };
}

const socket = io("ws://localhost:3030");

export const Map = (props: Props) => {
  const potholeIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2457/2457481.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 30],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [34, 34],
    shadowAnchor: [12, 41],
  });

  const blueIcon = new Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const [potholesArray, setPotholesArray] = useState<Pothole[]>([]);
  const [detector, setDetector] = useState<Detector>();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("message", (stringObj) => {
      const obj = JSON.parse(stringObj);
      switch (obj.messageType) {
        case "simple text":
          console.log(obj.message);
          break;
        case "pothole position":
          const pothole: Pothole = JSON.parse(obj.message);
          console.log("socket message : ", pothole.latitude, pothole.longitude);
          fetch("http://localhost:3000/", { method: "GET" })
            .then((response) => response.json())
            .then((data: Array<Pothole>) => {
              setPotholesArray(data);
              console.log("http://localhost:3000/ GET --> res : ", data);
            })
            .catch((error) => console.log(error));
          break;

        case "detector position":
          const detector: Detector = JSON.parse(obj.message);
          setDetector(detector);
          break;

        default:
          console.log("unknow socket message : ", stringObj);
      }
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("pong");
    };
  }, []);

  useEffect(() => {
    const fetchPositions = async () => {
      await fetch("http://localhost:3000/", { method: "GET" })
        .then((response) => response.json())
        .then((data: Array<Pothole>) => {
          setPotholesArray(data);
          console.log("http://localhost:3000/ GET --> res : ", data);
        })
        .catch((error) => console.log(error));
    };
    fetchPositions();
  }, []);

  return (
    <MapContainer center={[21.1, 6.9]} zoom={4} scrollWheelZoom={true}>
      <TileLayer
        maxZoom={18}
        tileSize={512}
        zoomOffset={-1}
        id="mapbox/streets-v11"
        accessToken="pk.eyJ1IjoiYmVuZXR0YWxlYiIsImEiOiJja2w3NWV1dnMyZXp4MnZsYjB1ZW9qcDVjIn0.fSUhZIwlPmxnd95ioh7e-Q"
        url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
      />
      {potholesArray.length !== 0 &&
        potholesArray.map((pot: Pothole) => (
          <Marker
            key={pot._id}
            icon={potholeIcon}
            position={[pot.latitude, pot.longitude]}
          >
            <Popup>
              Latitude : {pot.latitude}
              <br />
              Longitude : {pot.longitude}
            </Popup>
          </Marker>
        ))}

      {detector && (
        <Marker
          key={detector._id}
          icon={blueIcon}
          position={[
            detector.currentPosition.latitude,
            detector.currentPosition.longitude,
          ]}
        >
          <Popup>
            Latitude : {detector.currentPosition.latitude}
            <br />
            Longitude : {detector.currentPosition.longitude}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};
