// Team theme interface
export interface TeamTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  font: string
  gsapEase: string
}

// Team interface
export interface Team {
  id: string
  name: string
  shortName: string
  base: string
  founded: number
  championships: number
  theme: TeamTheme
}

// Driver interface
export interface Driver {
  id: string
  name: string
  firstName: string
  lastName: string
  number: number
  nationality: string
  teamId: string
  championships: number
  wins: number
  podiums: number
}

// Race interface
export interface Race {
  round: number
  raceName: string
  circuit: string
  country: string
  date: string
  winner?: string
}

// Union type for team IDs
export type TeamId =
  | 'ferrari'
  | 'redbull'
  | 'mercedes'
  | 'mclaren'
  | 'astonmartin'
  | 'alpine'
  | 'williams'
  | 'haas'
  | 'audi'
  | 'racingbulls'
  | 'cadillac'