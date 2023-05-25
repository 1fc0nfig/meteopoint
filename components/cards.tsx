import styled from 'styled-components'
import Link from 'next/link'
import { Gateway } from '../pages/index'
import { Title } from './sharedstyles'
import { WiHumidity } from 'react-icons/wi'
import { TbTemperatureCelsius } from 'react-icons/tb'
import { IoAddCircleOutline } from 'react-icons/io5'

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-flow: column wrap;
  margin-top: 1.5rem;

  height: min-content;

  @media (max-width: 600px) {
    margin-top: 1.5rem;
  }
`

const Card = styled(Link)`
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

  width: 100%;

  &:hover,
  :focus,
  :active {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.secondary};
    border-color: ${({ theme }) => theme.colors.secondary};
    transform: scale(1.05);
    
  }
`

const StyledA = styled.a`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`

const GatewayTitle = styled(Title)`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`

const GatewayDescription = styled.p`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  line-height: 1.5;
  color: #666;
`

const LocationCoordinates = styled.p`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  line-height: 1.5;
`

const Text = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0 0;
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  width: 100%;
  height: 50%;
`

const Group = styled.div`
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: center;
  align-items: center;
`

const StyledLink = ({ href, name }) => (
  <Link href={href} passHref legacyBehavior>
    <StyledA>{name}</StyledA>
  </Link>
)

export default function Cards({ gateway }: { gateway: Gateway }) {
  
  return (
    <FlexContainer>
      {gateway ? (<Card href={`/gateway/${gateway._id}`}>
        <GatewayTitle>{gateway.name}</GatewayTitle>
        <GatewayDescription>{gateway.description}</GatewayDescription>
        <Row>
          <Group>
            <Text>20</Text>
            <TbTemperatureCelsius size={30} />
          </Group>
          <Group>
            <Text>50</Text>
            <WiHumidity size={30}/>
          </Group>
        </Row>
      </Card>) : (
        // Add react icon
        <Card href={`/add-gateway`}>
          <GatewayTitle>Add Gateway</GatewayTitle>
          <IoAddCircleOutline size={50} />
        </Card>
        )}
    </FlexContainer>
  )
}
