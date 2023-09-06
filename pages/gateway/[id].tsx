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

import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";

import { toast } from "react-toastify";
import router from "next/router";

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

export interface GatewayResponse {
  status: string;
  message: string;
  data: Gateway;
}

export interface MeasurementResponse {
  status: string;
  message: string;
  data: MeasurementData;
}

export interface MeasurementData {
  measurements: Measurement[];
  count: number;
}

export interface Gateway {
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

export interface Location {
  coordinates: [number, number];
  description: string;
  type: string;
}

export interface Measurement {
  temperature: number;
  humidity: number;
  timestamp: Date;
}

export interface GatewayDetailProps {
  gateway: Gateway;
  measurements: MeasurementData;
  initialStartTime: string;
  initialEndTime: string;
  initialGranularity: number;
}

export interface ChartData {
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

  const granularities = [
    { min: 5, hr: "5 minutes" },
    { min: 10, hr: "10 minutes" },
    { min: 30, hr: "30 minutes" },
    { min: 60, hr: "1 hour" },
    { min: 720, hr: "12 hours" },
    { min: 1440, hr: "1 day" },
  ];

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

  const processMeasurements = (measurements: Measurement[]) => {
    //console.log("processing measurements");
    //console.log("granularity", granularity);

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
        // timestamp without seconds
        timestamp: m.timestamp.toLocaleString().slice(0, -3),
      };
    });

    if (realCount === 0) {
      // toast.error("No measurements found in selected time range");
    } else if (nullCount > realCount) {
      setTimeout(() => {
        toast.warn(
          "Most of the measurements are missing in selected time range"
        );
      }, 10000);
    }

    //console.log("chartData", chartData);
    return chartData;
  };

  const fetchMeasurements = async () => {
    //console.log("fetching measurements");
    //console.log("granularity", granularity);
    if (!chartDataLoading) {
      setChartDataLoading(true);
      try {
        // Enable cors
        const response = await fetch(
          `https://meteopoint-be.vercel.app/api/measurement?gateway=${
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
        description: formData.get("locationDesc"),
        type: "Point",
      },
    };

    //console.log(newGateway);

    try {
      //console.log(gateway._id);
      const response = await fetch(
        `https://meteopoint-be.vercel.app/api/gateway/${gateway._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newGateway),
        }
      );

      switch (response.status) {
        case 200:
          toast.success("Gateway edited successfully");
          // parse response
          const gatewayResponse: GatewayResponse = await response.json();
          setGateway(gatewayResponse.data);
          break;
        case 400:
          // Parse the errors as toast
          // const data = await response.json();
          // data.errors.forEach((error) => toast.error(error));
          throw new Error("Bad request");
        default:
          throw new Error("Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const deleteHandler = async () => {
    //console.log("deleting gateway");
    try {
      const response = await fetch(
        `https://meteopoint-be.vercel.app/api/gateway/${gateway._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      switch (response.status) {
        case 200:
          toast.success("Gateway deleted successfully");
          router.push("/");
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

  const calculateGranularity = (
    start: Date,
    end: Date,
    granularity: number
  ): number => {
    const diffInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    let granularityIndex = 0;
    let newGranularity = granularities[granularityIndex];

    while (granularityIndex < granularities.length) {
      if (diffInMinutes / newGranularity.min < maxChartDataSamples) {
        // //console.log("potencional new granularity", newGranularity);

        if (newGranularity.min < granularity) {
          // continue searching
          granularityIndex++;
          newGranularity = granularities[granularityIndex];
          continue;
        } else {
          // found new granularity
          return newGranularity.min;
        }
      }

      granularityIndex++;
      newGranularity = granularities[granularityIndex];
    }
  };

  const setNewGranularity = (newGranularity: number) => {
    const checkGranularity = calculateGranularity(
      startTime,
      endTime,
      newGranularity
    );

    if (checkGranularity !== newGranularity) {
      // find the human readable granularity in granularities array
      const humanReadableGranularity = granularities.find(
        (granularity) => granularity.min === checkGranularity
      ).hr;

      toast.warning(
        `Granularity too high. Setting to ${humanReadableGranularity}`
      );
    }
    setGranularity(checkGranularity);
    return;
  };

  const setNewTime = (dates: Date[]) => {
    const [newStartTime, newEndTime] = dates;

    // Validate distance between start and end times
    if (newEndTime.getTime() - newStartTime.getTime() > yearMs) {
      newEndTime.setTime(newStartTime.getTime() + yearMs);
      newStartTime.setTime(newEndTime.getTime() - yearMs);

      toast.warning("Time range must be less than 1 year");
    }

    // Adjust if start time is >= end time
    if (newStartTime.getTime() >= newEndTime.getTime()) {
      newEndTime.setTime(newStartTime.getTime() + dayMs);
      newStartTime.setTime(newEndTime.getTime() - dayMs);

      toast.warning("Start time must be before end time");
    }

    // Set new start and end times
    setStartTime(newStartTime);
    setEndTime(newEndTime);

    // Update granularity
    const newGranularity = calculateGranularity(
      newStartTime,
      newEndTime,
      granularity
    );
    setGranularity(newGranularity);
  };

  const resetHandler = () => {
    setStartTime(new Date(Date.now() - dayMs));
    setEndTime(new Date());
    setGranularity(granularities[0].min);
  };

  useEffect(() => {
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
        <GraphWrapper>
          <Title>{gateway.name}</Title>
          <Description>{gateway.description}</Description>
          <Status>
            Status: <CodeTag>{gateway.status}</CodeTag>
          </Status>

          {/* measurement plotting */}
          <ResponsiveContainer width="80%" height={400}>
            <AreaChart
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
                stroke="#ff0000"
                fill="#ff0000"
              />
              <Area
                type="monotone"
                dataKey="humidity"
                stroke="#43bdff"
                fill="#43bdff"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* measurement controls */}
          <GraphControls>
            <StyledFlatpickr
              onChange={(date) => {
                if (date.length === 2) {
                  setNewTime(date);
                }
              }}
              value={[startTime, endTime]}
              options={{
                mode: "range",
                defaultDate: endTime,
                maxDate: new Date(),
                enableTime: true,
                time_24hr: true,
                dateFormat: "Y-m-d H:i",
              }}
            />

            <Label>Granularity:</Label>
            <Selector
              value={granularity}
              onChange={(e) => setNewGranularity(parseInt(e.target.value))}
            >
              {granularities.map((granularity) => (
                <option key={granularity.min} value={granularity.min}>
                  {granularity.hr}
                </option>
              ))}
            </Selector>
            {/* Reset button */}
            <Button onClick={() => resetHandler()}>Reset</Button>
          </GraphControls>
        </GraphWrapper>
        {/* </ResponsiveContainer> */}

        {/* Gateway Edit form */}
        <Title>Edit Gateway</Title>
        <GatewayForm
          gateway={gateway}
          onSubmit={submitHandler}
          onDelete={deleteHandler}
        />
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
      `https://meteopoint-be.vercel.app/api/gateway/${id}`
    );
    const gatewayData: GatewayResponse = await gatewayResponse.json();
    const gateway = gatewayData.data;

    const measurementResponse = await fetch(
      `https://meteopoint-be.vercel.app/api/measurement?gateway=${id}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&granularity=${granularity}`
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
    //console.log(error);
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
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  margin-bottom: 8rem;
  width: 50%;
`;

const GraphWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  @media (width < ${({ theme }) => theme.breakpoints.md}) {
        min-height: auto;
    }
`;

const Status = styled.div`
  margin: 1rem 0;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #000;
  background-color: #000;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
`;

const Selector = styled.select`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #000;
  font-size: 1rem;

  &:focus {
    outline: none;
  }
`;

const StyledFlatpickr = styled(Flatpickr)`
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #000;
  font-size: 1rem;
  margin-right: 1rem;
  text-align: center;
`;

export default GatewayDetailPage;
