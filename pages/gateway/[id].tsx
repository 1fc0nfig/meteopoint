import React, { useState, useEffect, useRef } from "react";
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
  inactive?: number;
}

const GatewayDetailPage: NextPage<GatewayDetailProps> = (
  props: GatewayDetailProps
) => {
  const [gateway, setGateway] = useState<Gateway | null>(props.gateway);
  const [measurements, setMeasurements] = useState<MeasurementData | null>(
    props.measurements
  );
  const [startTime, setStartTime] = useState<Date>(
    new Date(props.initialStartTime)
  );
  const [endTime, setEndTime] = useState<Date>(new Date(props.initialEndTime));
  const [granularity, setGranularity] = useState<number>(
    props.initialGranularity
  );

  const granularities = [5, 10, 30, 60, 720, 1440];
  const maxChartDataSamples = 500;

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartDataLoading, setChartDataLoading] = useState<boolean>(true);

  const dayMs = 24 * 60 * 60 * 1000;
  const yearMs = 365 * dayMs;
  const inputDebounce = 500;

  const setNewEndTimeTimeout = useRef<NodeJS.Timeout | null>(null);
  const setNewStartTimeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (measurements) {
      setChartDataLoading(true);
      setChartData(processMeasurements(measurements.measurements));
      setChartDataLoading(false);
    }
  }, []);

  // useEffect(() => {
  //   fetchMeasurements();
  // }, [startTime, endTime, granularity]);

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
      currentTimestamp = new Date(
        currentTimestamp.getTime() + granularity * 60000
      );
    }

    let nullCount = 0;
    let realCount = 0;

    chartMeasurements = chartMeasurements.map((chartMeasurement) => {
      const matchingMeasurement = measurements.find((measurement) => {
        const measurementTimestamp = new Date(measurement.timestamp);
        return (
          measurementTimestamp.getTime() >=
            chartMeasurement.timestamp.getTime() &&
          measurementTimestamp.getTime() <
            chartMeasurement.timestamp.getTime() + granularity * 60000
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

    if (realCount === 0) {
      toast.error("No measurements found in selected time range");
    } else if (nullCount > realCount) {
      toast.warn("Most of the measurements are missing in selected time range");
    }

    console.log("chartData", chartData);
    return chartData;
  };

  const fetchMeasurements = async () => {
    console.log("fetching measurements");
    if (!chartDataLoading) {
      setChartDataLoading(true);
      try {
        // Enable cors
        const response = await fetch(
          `https://meteopoint-be-1fc0nfig.vercel.app/api/measurement?gateway=${
            gateway._id
          }&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&granularity=${granularity}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data: MeasurementResponse = await response.json();
        if (response.status === 200) {
          const displayData = processMeasurements(
            data.data.measurements as Measurement[]
          );
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

  // Method to calculate the granularity based on the start and end time
  const calculateGranularity = (start: Date, end: Date): number => {
    const diffInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // return current granularity if that is ok
    const sampleCount = diffInMinutes / granularity;
    if (sampleCount <= maxChartDataSamples) {
      return granularity;
    }

    // find the first granularity that results in less or equal than max samples
    for (const granularity of granularities) {
      const sampleCount = diffInMinutes / granularity;

      if (sampleCount <= maxChartDataSamples) {
        return granularity;
      }
    }

    console.log("No granularity found");
    // return the smallest granularity if none is found (this means there would be more than max samples)
    return granularities[0];
  };

  // Method to set the new end time
  const setNewEndTime = (newEndTime: Date) => {
    if (setNewEndTimeTimeout.current)
      clearTimeout(setNewEndTimeTimeout.current);
    // Debouncing user input
    setNewEndTimeTimeout.current = setTimeout(() => {
      if (newEndTime.getTime() - startTime.getTime() > yearMs) {
        newEndTime = new Date(startTime.getTime() + yearMs);
      }

      if (newEndTime.getTime() <= startTime.getTime()) {
        const newStartTime = new Date(newEndTime.getTime() - dayMs);
        setStartTime(newStartTime);
      }

      setEndTime(newEndTime);
      const newGranularity = calculateGranularity(startTime, newEndTime);
      setGranularity(newGranularity);
    }, inputDebounce);
  };

  // Method to set the new start time
  const setNewStartTime = (newStartTime: Date) => {
    if (setNewStartTimeTimeout.current)
      clearTimeout(setNewStartTimeTimeout.current);
    // Debouncing user input
    setNewStartTimeTimeout.current = setTimeout(() => {
      if (endTime.getTime() - newStartTime.getTime() > yearMs) {
        newStartTime = new Date(endTime.getTime() - yearMs);
      }

      if (newStartTime.getTime() >= endTime.getTime()) {
        const newEndTime = new Date(newStartTime.getTime() + dayMs);
        setEndTime(newEndTime);
      }

      setStartTime(newStartTime);
      const newGranularity = calculateGranularity(newStartTime, endTime);
      setGranularity(newGranularity);
    }, inputDebounce);
  };

  const resetHandler = () => {
    setStartTime(new Date(Date.now() - dayMs));
    setEndTime(new Date());
    setGranularity(granularities[0]);
  };

  useEffect(() => {
    const newGranularity = calculateGranularity(startTime, endTime);
    console.log("newGranularity", newGranularity);
    setGranularity(newGranularity);
    fetchMeasurements();
  }, [granularity]);

  useEffect(() => {
    fetchMeasurements();
  }, [startTime, endTime]);

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
          <DateTimePicker
            onChange={(value) => setNewStartTime(value)}
            value={startTime}
          />
          <Label>End Time:</Label>
          <DateTimePicker
            onChange={(value) => setNewEndTime(value)}
            value={endTime}
          />
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
          {/* Reset button */}
          <Button onClick={() => resetHandler()}>Reset</Button>
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

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background-color: #000;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
`;


const Selector = styled.select``;

export default GatewayDetailPage;
