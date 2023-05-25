import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string
      secondary: string
      background: string
      border: string
    },
    breakpoints: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
    }
  }
}
