import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Your logic to fetch strategies from the database
  const strategies = await fetchStrategiesFromDatabase(); // Replace with actual DB fetching logic
  res.status(200).json(strategies);
}

async function fetchStrategiesFromDatabase() {
  // Simulating fetching strategies from the database
  return [
    { id: 1, name: 'Strategy 1' },
    { id: 2, name: 'Strategy 2' },
  ];
}
