import Head from 'next/head'
import {
  Container,
  Main,
  Title,
  Description,
  CodeTag,
} from '../components/sharedstyles'
import Cards from '../components/cards'
import { useEffect } from 'react';

export default function AddGateway(){
  return (
    <Container>
      <Head>
        <title>Add Gateway</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Main>
        <Title>Add Gateway</Title>
        <Description>
          <CodeTag>Gateway</CodeTag> is a device that collects data from sensors and sends it to the cloud.
        </Description>
        <Cards gateway={null} />
      </Main>
    </Container>
  )  
}

