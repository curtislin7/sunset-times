import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import parse from 'autosuggest-highlight/parse';
import throttle from 'lodash/throttle';

const autocompleteService = { current: null };
const geocoder = { current: null };
const places = { current: null };
const useStyles = makeStyles((theme) => ({
  icon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2),
  },
}));

// TODO: fix spacing in this file

const Locater = ({latLong, setLatLong, value, setValue}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);
  const classes = useStyles();

  const fetch = React.useMemo(
    () =>
      throttle((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 200),
    [],
  );

  React.useEffect(() => {
    let active = true;
    if (!autocompleteService.current && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);

      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  const getLatLong = (placeId) => {
    if (!geocoder.current && window.google) {
      geocoder.current = new window.google.maps.Geocoder();
    }
    if (placeId) {
      geocoder.current.geocode({placeId}, (responses, status) => {
        if(status === 'OK') {
          const lat = responses[0].geometry.location.lat();
          const long = responses[0].geometry.location.lng();
          setLatLong({
            lat,
            long
          });
        } else {
          setLatLong(undefined);
        }
      });
    } else {
      setLatLong(undefined);
    }
  };

  return (
    <Autocomplete
      id="google-autocomplete"
      style={{ width: 300 }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.description)}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      onChange={(event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        getLatLong(newValue ? newValue.place_id : undefined);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Add a location" variant="outlined" fullWidth />
      )}
      renderOption={(option) => {
        const matches = option.structured_formatting.main_text_matched_substrings;
        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length]),
        );

        return (
          <Grid container alignItems="center">
            <Grid item>
              <LocationOnIcon className={classes.icon} />
            </Grid>
            <Grid item xs>
              {parts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}

              <Typography variant="body2" color="textSecondary">
                {option.structured_formatting.secondary_text}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
  );
}

export default Locater;