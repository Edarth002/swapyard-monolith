import { useState, useEffect } from 'react';

interface State {
    name: string;
    state_code: string;
}

interface CountryData {
    name: string;
    iso3: string;
    states: State[];
}

export function useCountriesAndStates(defaultCountry: string = "Nigeria") {
    const [data, setData] = useState<CountryData[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
    const [selectedState, setSelectedState] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch all countries and states on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://countriesnow.space/api/v0.1/countries/states');
                const result = await response.json();
                
                if (!result.error) {
                    setData(result.data);
                    
                    // Extract just the country names and sort them alphabetically
                    const countryList = result.data.map((c: CountryData) => c.name).sort();
                    setCountries(countryList);
                }
            } catch (error) {
                console.error("Error fetching countries:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Update states list whenever the selected country changes
    useEffect(() => {
        if (data.length > 0 && selectedCountry) {
            const countryInfo = data.find(c => c.name === selectedCountry);
            
            if (countryInfo && countryInfo.states && countryInfo.states.length > 0) {
                const stateList = countryInfo.states.map(s => s.name);
                setStates(stateList);
                setSelectedState(stateList[0]); // Auto-select the first state
            } else {
                setStates([]);
                setSelectedState("");
            }
        }
    }, [selectedCountry, data]);

    return {
        countries,
        states,
        selectedCountry,
        setSelectedCountry,
        selectedState,
        setSelectedState,
        loading
    };
}