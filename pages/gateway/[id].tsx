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

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../../components/navbar";

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
  data: {
    measurements: Measurement[];
    count: number;
  };
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
  timestamp: Date;
  temperature: number;
  humidity: number;
}

interface GatewayDetailProps {
  gateway: Gateway;
  measurements: MeasurementData;
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
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [granularity, setGranularity] = useState<number>(5);

  return (
    <>
      <Head>
        <title>{gateway.name}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <Container>
        <Title>{gateway.name}</Title>
        <Description>
          <CodeTag>Gateway</CodeTag> is a device that collects data from sensors
          and sends it to the cloud.
        </Description>
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

    const measurementsData: MeasurementResponse = await measurementResponse.json();
    const measurements = measurementsData.data;

    return {
      props: {
        gateway,
        measurements,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      props: {
        gateway: null,
        measurements: null,
      },
    };
  }
}

export default GatewayDetailPage;
