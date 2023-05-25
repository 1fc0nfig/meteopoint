import Head from "next/head";
import { Container, Main, Title } from "../components/sharedstyles";
import GatewayForm from "../components/gatewayform";
import Navbar from "../components/navbar";
import { toast } from "react-toastify";

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
