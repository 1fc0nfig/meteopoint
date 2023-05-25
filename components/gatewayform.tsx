// Gateway form
//
// Path: components/gatewayform.tsx
// Compare this snippet from pages/index.tsx:

import Head from "next/head";
import {
  Container,
  Main,
  CardGrid,
  Title,
  Description,
  CodeTag,
} from "../components/sharedstyles";
import { Gateway, Location } from "../pages/index";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 80%;
  margin: 3rem auto;
`;

const Input = styled.input`
  width: 100%;
  height: 2rem;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 80%;
`;

const Label = styled.label`
  margin: 0.5rem 0;
`;

const Button = styled.button`
  width: 100%;
  height: 2rem;
  margin: 1rem 0;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};

  transition: all 0.15s ease-in-out;

  &:hover,
  :focus,
  :active {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.secondary};
    border-color: ${({ theme }) => theme.colors.secondary};
    transform: scale(1.1);
  }
`;

const Divider = styled.hr`
  width: 100%;
  margin: 2rem 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export interface GatewayFormProps {
  gateway?: Gateway;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const GatewayForm = (props: GatewayFormProps) => {
  const [gateway, setGateway] = useState<Gateway | null>(props.gateway);
  const [location, setLocation] = useState<Location | null>(null);

  // Permission prompt will be displayed to the user
  // You can show a location permission request to the user
  // and handle the result accordingly
  const handlePermission = () => {
    navigator.permissions
      .query({ name: "geolocation" })
      .then(function (result) {
        if (result.state === "granted") {
          // User has granted permission
          toast.success("Location permission granted.");
          navigator.geolocation.getCurrentPosition((position) => {
            setLocation({
              coordinates: [
                position.coords.latitude,
                position.coords.longitude,
              ],
              description: "Current location",
              type: "Point",
            });
          });
        } else if (result.state === "denied") {
          // User has denied permission
          toast.error(
            "Location permission denied. You can consent again in browser settings."
          );
        }
      });
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then(function (result) {
          console.log(result);
          if (result.state === "granted") {
            // Permission has already been granted
            toast.info("Using current location.");
            navigator.geolocation.getCurrentPosition((position) => {
              setLocation({
                coordinates: [
                  position.coords.latitude,
                  position.coords.longitude,
                ],
                description: "Current location",
                type: "Point",
              });
            });
          } else if (result.state === "prompt") {
            // Wait for user input to consent
            handlePermission();
          } else if (result.state === "denied") {
            // Permission has been denied
            toast.error(
              "Location permission denied. You can consent again in browser settings."
            );
          }
        });
    } else {
      // Geolocation is not supported by the browser
      // Handle the lack of support accordingly
      toast.error("Geolocation is not supported by your browser.");
    }
  }, []);

  return (
    <>
      <Form onSubmit={(e) => props.onSubmit(e)}>
        <Column>
          <Label htmlFor="name">Name</Label>
          <Input type="text" id="name" name="name" />
          <Label htmlFor="serial">Description</Label>
          <Input type="text" id="serial" name="description" />
          <Label>GPS - Latitude & Longitude</Label>
          <Row>
            <Input
              type="number"
              id="latitude"
              name="latitude"
              value={location !== null ? location.coordinates[1] : ""}
            />
            <Input
              type="number"
              id="longitude"
              name="longitude"
              value={location !== null ? location.coordinates[0] : ""}
            />
            {/* <Button onClick={handlePermission}>
              Request Location Permission
            </Button> */}
          </Row>
          <Label htmlFor="location">Location description</Label>
          <Input
            type="text"
            id="location"
            name="location"
            value={location !== null ? location.description : ""}
          />

          <Label htmlFor="gmid">Serial number</Label>
          <Input type="text" id="gmid" name="gmid" />
          <Divider />
          <Button type="submit">Submit</Button>
        </Column>
      </Form>
    </>
  );
};

export default GatewayForm;
