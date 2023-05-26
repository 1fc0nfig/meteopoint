import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";
import {
  Container,
  Main,
  Title,
  Description,
  CodeTag,
} from "../../components/sharedstyles";

import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";

import { toast } from "react-toastify";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import Navbar from "../../components/navbar";
import GatewayForm from "../../components/gatewayform";

interface GatewayResponse {
  status: string;
  message: string;
  data: {
    gateway: Gateway;
  };
}

interface MeasurementResponse {
  status: string;
  message: string;
  data: MeasurementData;
}

interface MeasurementData {
  measurements: Measurement[];
  count: number;
}

interface Gateway {
  _id: string;
  gmid: string;
  name: string;
  description: string;
  status: string;
  location: Location;
  sys: {
    _id: string;
    cts: string;
    mts: string;
    rev: number;
  };
  __v: number;
}

interface Location {
  coordinates: [number, number];
  description: string;
  type: string;
}

interface Measurement {
  temperature: number;
  humidity: number;
  timestamp: Date;
}

interface GatewayDetailProps {
  gateway: Gateway;
  measurements: MeasurementData;
  initialStartTime: string;
  initialEndTime: string;
  initialGranularity: number;
}

interface ChartData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

const GatewayDetailPage: NextPage<GatewayDetailProps> = (
  props: GatewayDetailProps
) => {
  const [gateway, setGateway] = useState<Gateway | null>(props.gateway);
  const [measurements, setMeasurements] = useState<MeasurementData | null>(
    props.measurements
  );
  const [startTime, setStartTime] = useState<Date>(new Date(props.initialStartTime));
  const [endTime, setEndTime] = useState<Date>(new Date(props.initialEndTime));
  const [granularity, setGranularity] = useState<number>(props.initialGranularity);

  const granularities = [5, 10, 30, 60, 720, 1440, 10080];

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartDataLoading, setChartDataLoading] = useState<boolean>(true);

  useEffect(() => {
    if (measurements) {
      setChartDataLoading(true);
      setChartData(processMeasurements(measurements.measurements));
      setChartDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [startTime, endTime, granularity]);

  const processMeasurements = (measurements: Measurement[]) => {
    console.log("processing measurements");
  
    let chartMeasurements: Measurement[] = [];
    let currentTimestamp = new Date(startTime);
    while (currentTimestamp <= endTime) {
      chartMeasurements.push({
        temperature: null,
        humidity: null,
        timestamp: new Date(currentTimestamp),
      });
      currentTimestamp = new Date(currentTimestamp.getTime() + granularity * 60000);
    }
  
    let nullCount = 0;
    let realCount = 0;
  
    chartMeasurements = chartMeasurements.map((chartMeasurement) => {
      const matchingMeasurement = measurements.find((measurement) => {
        const measurementTimestamp = new Date(measurement.timestamp);
        return (
          measurementTimestamp.getTime() >= chartMeasurement.timestamp.getTime() &&
          measurementTimestamp.getTime() < chartMeasurement.timestamp.getTime() + granularity * 60000
        );
      });
      
      if (matchingMeasurement) {
        realCount++;
        // real Measurement
        return {
          temperature: matchingMeasurement.temperature,
          humidity: matchingMeasurement.humidity,
          timestamp: chartMeasurement.timestamp,
        };
      } else {
        // null Measurement
        nullCount++;
        return chartMeasurement;
      }
    });
  
    const chartData: ChartData[] = chartMeasurements.map((m) => {
      return {
        temperature: m.temperature,
        humidity: m.humidity,
        timestamp: m.timestamp.toLocaleString(),
      };
    });
  
    console.log("measurements", measurements);
    console.log("chartData", chartData);
    
    if (nullCount > realCount) {
      toast.warn("Most of the measurements are missing in selected time range");
    }
    
    return chartData;
  }  

  const fetchMeasurements = async () => {
    console.log("fetching measurements");
    if (!chartDataLoading) {
      setChartDataLoading(true);
      try {
        const response = await fetch(
          `http://meteopoint-be-1fc0nfig.vercel.app/api/measurement?gateway=${gateway._id}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&granularity=${granularity}`
        );
        const data: MeasurementResponse = await response.json();
        if (response.status === 200) {
          const displayData = processMeasurements(data.data.measurements as Measurement[])
          if (displayData.length === 0) {
            toast.warning("No measurements found for specified time period.");
          } else {
            setChartData(displayData);
          }
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setChartDataLoading(false);
      }
    }
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newGateway = {
      gmid: formData.get("gmid"),
      name: formData.get("name"),
      description: formData.get("description"),
      location: {
        coordinates: [formData.get("longitude"), formData.get("latitude")],
        description: formData.get("location"),
      },
    };

    try {
      const response = await fetch("http://localhost:3000/api/gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGateway),
      });

      switch (response.status) {
        case 201:
          toast.success("Gateway created successfully");
          break;
        case 400:
          throw new Error("Bad request");
        default:
          throw new Error("Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <>
      <Head>
        <title>{gateway.name}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <Container>
        <Title>{gateway.name}</Title>
        {/* measurement plotting */}
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            width={500}
            height={400}
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#8884d8"
              fill="#8884d8"
            />
            <Area
              type="monotone"
              dataKey="humidity"
              stroke="#82ca9d"
              fill="#82ca9d"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* measurement controls */}
        <GraphControls>
          <Label>Start Time:</Label>
          <DateTimePicker onChange={setStartTime} value={startTime} />
          <Label>End Time:</Label>
          <DateTimePicker onChange={setEndTime} value={endTime} />
          <Label>Granularity:</Label>
          <Selector
            value={granularity}
            onChange={(e) => setGranularity(parseInt(e.target.value))}
          >
            {granularities.map((granularity) => (
              <option key={granularity} value={granularity}>
                {granularity} minutes
              </option>
            ))}
          </Selector>
        </GraphControls>

        {/* Gateway Edit form */}
        <Title>Edit Gateway</Title>
        <GatewayForm gateway={gateway} onSubmit={(e) => submitHandler} />
        <Main></Main>
      </Container>
    </>
  );
};

export async function getServerSideProps({ query }) {
  try {
    const { id } = query;
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = new Date(Date.now());
    const granularity = 5;

    const gatewayResponse = await fetch(
      `https://meteopoint-be-1fc0nfig.vercel.app/api/gateway/${id}`
    );
    const gatewayData: GatewayResponse = await gatewayResponse.json();
    const gateway = gatewayData.data;

    const measurementResponse = await fetch(
      `https://meteopoint-be-1fc0nfig.vercel.app/api/measurement?gateway=${id}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&granularity=${granularity}`
    );

    const measurementsData: MeasurementResponse =
    await measurementResponse.json();
    const measurements = measurementsData.data;

    return {
      props: {
        gateway,
        measurements,
        initialStartTime: startTime.toISOString(),
        initialEndTime: endTime.toISOString(),
        initialGranularity: granularity,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      props: {
        gateway: null,
        measurements: null,
        startTime: null,
        endTime: null,
        granularity: null,
      },
    };
  }
}

const GraphControls = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  margin-bottom: 8rem;
`;

const Selector = styled.select``;

export default GatewayDetailPage;
