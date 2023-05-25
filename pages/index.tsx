import Head from 'next/head'
import {
  Container,
  Main,
  CardGrid,
  Title,
  Description,
  CodeTag,
} from '../components/sharedstyles'
import Cards from '../components/cards'
import { useEffect } from 'react';

export interface Location {
  coordinates: [number, number];
  description: string;
  type: string;
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
}

export interface GatewayResponse {
  status: string;
  message: string;
  data: {
      count: number;
      gateways: Gateway[];
  };
}

interface HomeProps {
  gateways: Gateway[];
}

export default function Home({ gateways }: HomeProps) {
  
  useEffect(() => {
    console.log(gateways)
  }, []
  )
  return (
    <Container>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Title>
          Meteopoint!
      </Title>
      <CardGrid>
        {gateways.map((gateway: Gateway) => (
          <Cards key={gateway._id} gateway={gateway as Gateway} />
        ))}
        <Cards gateway={null}/>
      </CardGrid>
    </Container>
  )
}

export async function getServerSideProps() {
  try {
    // Fetch gateway data
    const res = await fetch('https://meteopoint-be-1fc0nfig.vercel.app/api/gateway')
    const data: GatewayResponse = await res.json()
    const gateways = data.data.gateways

    return {
      props: {
        gateways,
      },
    }
  } catch (err) {
    console.error(err)
    return {
      props: {
        gateways: [],
      },
    }
  }
}
