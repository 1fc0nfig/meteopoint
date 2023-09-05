import Head from "next/head";
import { Container, Main, Title } from "../components/sharedstyles";
import GatewayForm from "../components/gatewayform";
import Navbar from "../components/navbar";
import { toast } from "react-toastify";
import router from "next/router";

export default function AddGateway() {
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
      },
    };
  
    try {
      const response = await fetch("https://meteopoint-be.vercel.app/api/gateway/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGateway),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success("Gateway created successfully");
        router.push("/");
      } else if (response.status === 400) {
        data.errors.forEach((error) => toast.error(error));
        throw new Error(data);
      } else {
        throw new Error("Something went wrong");
      }
    } catch (error) {
      // ??
    }
  };
  

  return (
    <>
    <Navbar />
      <Container>
        <Head>
          <title>Add Gateway</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Main>
          <Title>Register new gateway</Title>
          <GatewayForm onSubmit={submitHandler} />
        </Main>
      </Container>
    </>
  );
}
