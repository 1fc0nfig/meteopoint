import Link from "next/link";
import styled from "styled-components";
import { BsArrowLeft } from "react-icons/bs";

export const Container = styled.nav`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  align-content: center;
  width: 100%;
`;

export const StyledBsArrowLeft = styled(BsArrowLeft)`
  position: absolute;
  top: 1rem;
  left: 1rem;

  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  transition: all 0.15s ease-in-out;

  &:hover,
  :focus,
  :active {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.secondary};
    transform: scale(1.05);
  }
`;

export default function Navbar() {
  return (
    <Container>
      <Link href="/">
        <StyledBsArrowLeft />
      </Link>
    </Container>
  );
}