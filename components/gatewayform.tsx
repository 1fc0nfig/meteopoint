// Gateway form
//
// Path: components/gatewayform.tsx
// Compare this snippet from pages/index.tsx:

import Head from "next/head";
import { Container, Main, CardGrid, Title, Description, CodeTag } from "../components/sharedstyles";
import { Gateway, Location } from "../pages/index";
import styled from "styled-components";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

interface Errors {
    name?: string;
    description?: string;
    location?: {
        coordinates: [string, string];
        description: string;
    };
}

const Form = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* width: 100%; */
    background-color: #ffff;
    /* margin-bottom: 20px; */
    border-radius: 20px;
    min-width: 600px;
    margin: 3rem auto;
    @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
        min-width: 400px;
        margin: 3rem 0;
    }
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
    > * {
        &:first-child {
            margin-right: 10px;
        }
    }
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 80%;
    padding: 40px 0;
`;

const Label = styled.label`
    margin: 0.5rem 0;
    font-weight: 700;
`;

const Button = styled.button`
    width: 100%;
    height: 2rem;
    margin: 1rem 0;
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.secondary};
    border-radius: 10px;
    text-align: center;
    color: ${({ theme }) => theme.colors.background};

    font-weight: 700;
    transition: all 0.15s ease-in-out;
    background-color: #1d71f2;

    &:hover,
    :focus,
    :active {
        cursor: pointer;
        color: ${({ theme }) => theme.colors.background};
        border-color: ${({ theme }) => theme.colors.secondary};
        transform: scale(1.1);
        background-color: #5092f5;
    }
`;

const DeleteButton = styled.button`
    width: 100%;
    height: 2rem;
    margin: 1rem 0;
    padding: 0.5rem;
    border: 1px solid #f93f3f;
    border-radius: 10px;
    text-align: center;
    color: ${({ theme }) => theme.colors.background};

    font-weight: 700;
    transition: all 0.15s ease-in-out;
    background-color: #f93f3f;

    &:hover,
    :focus,
    :active {
        cursor: pointer;
        color: ${({ theme }) => theme.colors.background};
        /* border-color: ${({ theme }) => theme.colors.secondary}; */
        transform: scale(1.1);
        background-color: #f86161;
    }
`;

const Divider = styled.hr`
    width: 100%;
    margin: 2rem 0;
    border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FormErrors = styled.div`
    font-size: 12px;
    height: 32px;
    /* margin-top: 4px; */
    font-weight: 400;
    /* display: flex; */
    color: #eb0037;
    /* text-align: center; */
`;

const FormErrorsDesc = styled.p`
    margin-left: 4px;
`;

export interface GatewayFormProps {
    gateway?: Gateway;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    onDelete?: () => void;
}

const GatewayForm = (props: GatewayFormProps) => {
    const [gateway, setGateway] = useState<Gateway | null>(props.gateway);
    const [location, setLocation] = useState<Location | null>(props.gateway?.location);

    // Validation input
    const initialValues = {
        name: gateway?.name || "",
        description: gateway?.description || "",
        location: {
            coordinates: [location ? location.coordinates[1] : "", location ? location.coordinates[0] : ""],
            description: location ? location.description : "",
        },
    };
    // const initialValues = {
    //     name: "",
    //     description: "",
    //     location: {
    //         coordinates: ["", ""],
    //         description: "",
    //     },
    // };
    const [formValues, setFormValues] = useState(initialValues);
    const [formErrors, setFormErrors] = useState<Errors>({});
    const [isSubmit, setIsSubmit] = useState(false);

    const ref: any = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // const { name, value } = ref.current;
        console.log("name:", name);
        console.log("value:", value);
        setFormValues({ ...formValues, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormErrors(validate(formValues));
        setIsSubmit(true);
    };
    useEffect(() => {
        console.log(formErrors);
        if (Object.keys(formErrors).length === 0 && isSubmit) {
            console.log(formValues);
        }
    }, [formErrors]);
    const validate = (values) => {
        const errors: Errors = {};
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        if (!values.name) {
            errors.name = "Name is required!";
        }
        if (!values.description) {
            errors.description = "Description is required!";
        }
        if (!values.location) {
            errors.location.description = "Location description is required!";
        }
        // if (!values.GPS) {
        //   errors.password = "Password is required";
        // } else if (values.password.length < 4) {
        //   errors.password = "Password must be more than 4 characters";
        // } else if (values.password.length > 10) {
        //   errors.password = "Password cannot exceed more than 10 characters";
        // }
        return errors;
    };

    let toastDisplayed = false;

    // Permission prompt will be displayed to the user
    // You can show a location permission request to the user
    // and handle the result accordingly
    const handlePermission = () => {
        navigator.permissions.query({ name: "geolocation" }).then(function (result) {
            if (result.state === "granted") {
                // User has granted permission
                toast.success("Location permission granted.");
                navigator.geolocation.getCurrentPosition((position) => {
                    setLocation({
                        coordinates: [position.coords.latitude, position.coords.longitude],
                        description: "Current location",
                        type: "Point",
                    });
                });
            } else if (result.state === "denied") {
                // User has denied permission
                toast.error("Location permission denied. You can consent again in browser settings.");
            }
        });
    };

    useEffect(() => {
        if (props.gateway) {
            // For edit gateway purposes, we don't need to get the user's location
            return;
        }

        // Check if the browser supports geolocation
        if ("geolocation" in navigator) {
            navigator.permissions.query({ name: "geolocation" }).then(function (result) {
                if (result.state === "granted") {
                    // Permission has already been granted
                    if (!toastDisplayed) {
                        toast.info("Using current location.");
                        toastDisplayed = true;
                    }
                    navigator.geolocation.getCurrentPosition((position) => {
                        setLocation({
                            coordinates: [position.coords.latitude, position.coords.longitude],
                            description: "Current location",
                            type: "Point",
                        });
                    });
                } else if (result.state === "prompt") {
                    // Wait for user input to consent
                    handlePermission();
                } else if (result.state === "denied") {
                    // Permission has been denied
                    toast.error("Location permission denied. You can consent again in browser settings.");
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
            <Form
                // onSubmit={(e) => props.handleSubmit(e)}
                onSubmit={handleSubmit}
            >
                <Column>
                    <Label htmlFor="name">Name</Label>
                    <Input type="text" id="name" name="name" value={formValues.name} onChange={handleChange} />
                    {formErrors.name ? (
                        <FormErrors>
                            <FormErrorsDesc>{formErrors.name}</FormErrorsDesc>
                        </FormErrors>
                    ) : null}
                    <Label htmlFor="serial">Description</Label>
                    <Input
                        type="text"
                        id="serial"
                        name="description"
                        value={formValues.description}
                        onChange={handleChange}
                    />
                    {formErrors.description ? (
                        <FormErrors>
                            <FormErrorsDesc>{formErrors.description}</FormErrorsDesc>
                        </FormErrors>
                    ) : null}

                    <Label>GPS - Latitude & Longitude</Label>
                    <Row>
                        <Input
                            type="number"
                            id="latitude"
                            name="latitude"
                            value={formValues.location.coordinates[1]}
                            onChange={handleChange}
                        />
                        <Input
                            type="number"
                            id="longitude"
                            name="longitude"
                            value={formValues.location.coordinates[0]}
                            onChange={handleChange}
                        />
                    </Row>
                    <Label htmlFor="location">Location description</Label>
                    <Input type="text" id="location" name="location" value={formValues.location.description} />

                    {
                        // If the gateway is being edited, the serial number should not be editable
                        props.gateway ? (
                            <></>
                        ) : (
                            <>
                                <Label htmlFor="gmid">Serial number</Label>
                                <Input type="text" id="gmid" name="gmid" defaultValue={gateway?.gmid || ""} />
                            </>
                        )
                    }
                    <Divider />
                    <Button type="submit">Submit</Button>
                    {/* Delete button */}
                    {props.gateway ? (
                        <DeleteButton type="button" onClick={props.onDelete}>
                            Delete
                        </DeleteButton>
                    ) : (
                        <></>
                    )}
                </Column>
            </Form>
        </>
    );
};

export default GatewayForm;
