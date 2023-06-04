import styled from "styled-components";
import Link from "next/link";
import { Gateway } from "../pages/index";
import { Title } from "./sharedstyles";
import { useState } from "react";

import { WiHumidity } from "react-icons/wi";
import { TbTemperatureCelsius } from "react-icons/tb";
import { IoAddCircleOutline } from "react-icons/io5";

const FlexContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-flow: column wrap;
    margin-top: 1.5rem;

    height: min-content;

    flex-wrap: wrap;
    align-self: normal;
    aspect-ratio: 1/1;

    @media (max-width: 600px) {
        margin-top: 1.5rem;
    }
`;

const Card = styled(Link)<{ status?: string }>`
    ${(props) =>
        props?.status === "inactive"
            ? `

            display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    color: #666;
    text-decoration: none;
    border: 1px solid black;
    border-radius: 10px;
    transition: all 0.15s ease-in-out;
    background-color: #ffff;
    width: 100%;
    height: 100%;
    cursor: auto    
    `
            : `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    color: inherit;
    text-decoration: none;
    border: 1px solid black;
    border-radius: 10px;
    transition: all 0.15s ease-in-out;
    background-color: #ffff;
    width: 100%;
    height: 100%;
    &:hover,
    :focus,
    :active {
        cursor: pointer;
        color: ${({ theme }) => theme.colors.secondary};
        border-color: ${({ theme }) => theme.colors.secondary};
        transform: scale(1.05);
        /* background-color: #ffff; */
    }
    `}
`;

const StyledA = styled.a`
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
`;

const GatewayTitle = styled(Title)`
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
`;

const GatewayDescription = styled.p`
    margin: 0 0 1rem 0;
    font-size: 1rem;
    line-height: 1.5;
    color: #666;
`;
const GatewayDescriptionWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    margin-top: auto;
    align-items: center;
`;

const LocationCoordinates = styled.p`
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    line-height: 1.5;
`;

const Text = styled.p`
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0 0 0 0;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    width: 100%;
    /* height: 50%; */
`;

const Group = styled.div`
    display: flex;
    flex-direction: row;
    align-content: center;
    justify-content: center;
    align-items: center;
`;

const GatewayStatus = styled.p`
    margin: 0 0 1rem 0;
    font-size: 1rem;
    line-height: 1.5;
    color: #666;
`;

const StyledLink = ({ href, name }) => (
    <Link href={href} passHref legacyBehavior>
        <StyledA>{name}</StyledA>
    </Link>
);

// export const Switch = ({ isOn, handleToggle, onColor }) => {
//     return (
//         <>
//             <input
//                 checked={isOn}
//                 onChange={handleToggle}
//                 className="react-switch-checkbox"
//                 id={`react-switch-new`}
//                 type="checkbox"
//             />
//             <label style={{ background: isOn && onColor }} className="react-switch-label" htmlFor={`react-switch-new`}>
//                 <span className={`react-switch-button`} />
//             </label>
//         </>
//     );
// };

//   export default Switch;

export default function Cards({ gateway }: { gateway: Gateway }) {
    const [value, setValue] = useState(false);
    return (
        <FlexContainer>
            {gateway ? (
                <Card status={gateway.status} href={`/gateway/${gateway._id}`}>
                    <GatewayTitle>{gateway.name}</GatewayTitle>
                    <GatewayDescriptionWrapper>
                        <GatewayDescription>{gateway.description}</GatewayDescription>
                        <GatewayStatus>{gateway.status}</GatewayStatus>
                        {/* <Switch isOn={value} onColor="#EF476F" handleToggle={() => setValue(!value)} /> */}
                        <Row>
                            <Group>
                                <Text>{gateway.latest?.temperature}</Text>
                                <TbTemperatureCelsius size={30} />
                            </Group>
                            <Group>
                                <Text>{gateway.latest?.humidity}</Text>
                                <WiHumidity size={30} />
                            </Group>
                        </Row>
                    </GatewayDescriptionWrapper>
                </Card>
            ) : (
                // Add react icon
                <Card href={`/add-gateway`}>
                    <GatewayTitle>Add Gateway</GatewayTitle>
                    <IoAddCircleOutline size={50} />
                </Card>
            )}
        </FlexContainer>
    );
}
