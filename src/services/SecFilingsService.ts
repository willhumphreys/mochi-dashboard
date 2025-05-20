// SecFilingsService.ts
import { readJsonFromS3WithSignedUrl, listAllKeys } from "./S3Service";
import { SecFiling, SecPosition } from "../types";

// Constants
const SEC_FILINGS_BUCKET = "mochi-prod-portfolio-tracking";
const SEC_FILINGS_PREFIX = "sec-filings/13F";

/**
 * Interface for a person with SEC filings
 */
interface SecFilingPerson {
  id: string;
  name: string;
}

/**
 * List of people with SEC filings
 * This could be fetched from S3 in the future
 */
const SEC_FILING_PEOPLE: SecFilingPerson[] = [
  {
    id: "1067983",
    name: "Warren Buffett (Berkshire Hathaway)"
  }
];

/**
 * Gets the list of people with SEC filings
 * @returns Array of people with SEC filings
 */
export const getSecFilingPeople = async (): Promise<SecFilingPerson[]> => {
  // In the future, this could fetch the list from S3
  return SEC_FILING_PEOPLE;
};

/**
 * Gets the list of available SEC filings for a person
 * @param personId - ID of the person
 * @returns Promise that resolves to an array of filing dates
 */
export const getSecFilingDates = async (personId: string): Promise<string[]> => {
  try {
    // List objects in the person's directory
    const prefix = `${SEC_FILINGS_PREFIX}/${personId}/`;

    // Get all keys from S3 with the specified prefix
    const keys = await listAllKeys(SEC_FILINGS_BUCKET, prefix);

    // Extract dates from the keys
    // Expected format: sec-filings/13F/{personId}/{personId}_positions_{date}.json
    const dateRegex = new RegExp(`${personId}_positions_(\\d{4}-\\d{2}-\\d{2})\\.json$`);

    const dates = keys
      .map(key => {
        const match = key.match(dateRegex);
        return match ? match[1] : null;
      })
      .filter((date): date is string => date !== null);

    return dates;
  } catch (error) {
    console.error(`Error fetching SEC filing dates for person ${personId}:`, error);
    throw error;
  }
};

/**
 * Fetches an SEC filing for a person on a specific date
 * @param personId - ID of the person
 * @param date - Date of the filing (YYYY-MM-DD)
 * @returns Promise that resolves to the SEC filing
 */
export const getSecFiling = async (personId: string, date: string): Promise<SecFiling> => {
  try {
    const key = `${SEC_FILINGS_PREFIX}/${personId}/${personId}_positions_${date}.json`;

    // Fetch the filing from S3
    const positions = await readJsonFromS3WithSignedUrl<SecPosition[]>(
      SEC_FILINGS_BUCKET,
      key
    );

    // Find the person's name
    const person = SEC_FILING_PEOPLE.find(p => p.id === personId);
    const personName = person ? person.name : personId;

    return {
      personId,
      personName,
      filingDate: date,
      positions
    };
  } catch (error) {
    console.error(`Error fetching SEC filing for person ${personId} on date ${date}:`, error);
    throw error;
  }
};

/**
 * Fetches all SEC filings for a person and calculates changes between filings
 * @param personId - ID of the person
 * @returns Promise that resolves to an array of SEC filings with calculated changes
 */
export const getAllSecFilingsWithChanges = async (personId: string): Promise<SecFiling[]> => {
  try {
    // Get all filing dates for the person
    const dates = await getSecFilingDates(personId);

    // Sort dates in ascending order
    const sortedDates = [...dates].sort();

    // Fetch all filings
    const filings: SecFiling[] = await Promise.all(
      sortedDates.map(date => getSecFiling(personId, date))
    );

    // Calculate changes between filings
    for (let i = 1; i < filings.length; i++) {
      const currentFiling = filings[i];
      const previousFiling = filings[i - 1];

      // Create a map of previous positions by ticker for easy lookup
      const previousPositions = new Map<string, SecPosition>();
      previousFiling.positions.forEach(position => {
        previousPositions.set(position.Ticker, position);
      });

      // Calculate changes for each position in the current filing
      currentFiling.positions.forEach(position => {
        const previousPosition = previousPositions.get(position.Ticker);

        if (previousPosition) {
          // Calculate change in shares
          position.Change = position.TotalShares - previousPosition.TotalShares;

          // Calculate percent change
          if (previousPosition.TotalShares > 0) {
            position.PercentChange = (position.Change / previousPosition.TotalShares) * 100;
          } else if (position.Change !== 0) {
            // If previous shares were 0 and there's a change, it's a new position (100% increase)
            position.PercentChange = 100;
          } else {
            position.PercentChange = 0;
          }
        } else {
          // New position
          position.Change = position.TotalShares;
          position.PercentChange = 100;
        }
      });

      // Add positions that were in the previous filing but not in the current one
      // (these are positions that were completely sold)
      previousFiling.positions.forEach(prevPosition => {
        const exists = currentFiling.positions.some(
          currPosition => currPosition.Ticker === prevPosition.Ticker
        );

        if (!exists) {
          currentFiling.positions.push({
            ...prevPosition,
            TotalShares: 0,
            TotalValue: 0,
            Change: -prevPosition.TotalShares,
            PercentChange: -100
          });
        }
      });
    }

    return filings;
  } catch (error) {
    console.error(`Error fetching all SEC filings with changes for person ${personId}:`, error);
    throw error;
  }
};
