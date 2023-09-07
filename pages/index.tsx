import Head from "next/head";
import { useState, useEffect } from "react";
import { Container, CardGrid, Title } from "../components/sharedstyles";
import Cards from "../components/cards";

export interface Location {
  coordinates: [number, number];
  description: string;
  type: string;
}

export interface Measurement {
  _id: string;
  gateway: string;
  timestamp: string;
  temperature: number;
  humidity: number;
}

export interface Gateway {
  _id: string;
  gmid: string;
  sys: {
    cts: string;
    mts: string;
    rev: number;
    _id: string;
  };
  name: string;
  description: string;
  status: string;
  __v: number;
  location: Location;
  latest?: Measurement;
}

export interface LatestResponse {
  status: string;
  message: string;
  data: {
    count: number;
    measurements: Measurement[];
  };
}

export interface GatewayResponse {
  status: string;
  message: string;
  data: {
    count: number;
    gateways: Gateway[];
  };
}

interface GatewayState {
  _id: string;
  status: string;
}

interface HomeProps {
  gateways: Gateway[];
}

export default function Home({ gateways }: HomeProps) {
  console.log("props", gateways);
  const [updatedGateways, setUpdatedGateways] = useState<Gateway[]>(gateways);

  useEffect(() => {
    const checkGatewayStatus = async () => {
      const currentTime = new Date();
      const eightMinutesAgo = new Date(currentTime.getTime() - 10 * 60 * 1000);

      const updatedGateways: Gateway[] = gateways.map((gateway) => {
        if (
          gateway.latest &&
          new Date(gateway.latest.timestamp) < eightMinutesAgo
        ) {
          console.log(`Gateway ${gateway.name} is inactive ❌`);
          return {
            ...gateway,
            status: "inactive",
          };
        } else {
          console.log(`Gateway ${gateway.name} is active ✅`);
          return {
            ...gateway,
            status: "active",
          };
        }
        return gateway;
      });

      try {
        for (const gateway of updatedGateways) {
          const response = await fetch(
            `https://meteopoint-be.vercel.app/api/gateway/${gateway._id}/status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: gateway.status }),
            }
          );

          if (response.ok) {
            console.log("Gateway status updated successfully.");
          } else {
            console.log("Failed to update gateway status.");
          }
        }
        return updatedGateways; // Return the updated gateways
      } catch (error) {
        console.error("An error occurred while updating gateway statuses:", error);
        throw error; // Throw the error to handle it later
      }
    };

    console.log(gateways);
    checkGatewayStatus()
      .then((updatedGateways) => setUpdatedGateways(updatedGateways)) // Update the state with the returned gateways
      .catch((error) => console.error("Failed to update gateway statuses:", error));
  }, [gateways]);

  return (
    <Container>
      <Head>
        <title>Meteopoint</title>
        <meta
          name="description"
          content="Lightweight IoT weather station data visualizer"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Title>Meteopoint!</Title>
      <CardGrid>
        {updatedGateways.map((gateway: Gateway) => (
          <Cards key={gateway._id} gateway={gateway} />
        ))}
        <Cards gateway={null} />
      </CardGrid>
    </Container>
  );
}

export async function getServerSideProps() {
  try {
    const [gwRes, latestRes] = await Promise.all([
      fetch("https://meteopoint-be.vercel.app/api/gateway"),
      fetch("https://meteopoint-be.vercel.app/api/measurement/latest"),
    ]);

    const [gwData, latestData] = await Promise.all([
      gwRes.json(),
      latestRes.json(),
    ]);

    const gateways = gwData.data.gateways;
    const latestMeasurements = latestData.data.measurements;

    const gatewaysWithLatestMeasurements = gateways.map((gateway: Gateway) => {
      const matchingMeasurement = latestMeasurements.find(
        (measurement: Measurement) => measurement.gateway === gateway._id
      );
      if (matchingMeasurement) {
        return {
          ...gateway,
          latest: matchingMeasurement,
        };
      }
      return gateway;
    });

    return {
      props: {
        gateways: gatewaysWithLatestMeasurements,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      props: {
        gateways: [],
      },
    };
  }
}
