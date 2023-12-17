import { useState } from 'react';
import './App.css';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import OpenAI from 'openai';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';


function App() {

  const link = "https://b04f-185-84-106-199.ngrok-free.app/";

  const weightKeys = [
    "nameWeight", "japaneseNameWeight", "typeWeight", "episodesWeight",
    "studioWeight", "releaseSeasonWeight", "tagsWeight", "ratingWeight",
    "releaseYearWeight", "descriptionWeight", "contentWarningWeight",
    "relatedMangeWeight", "relatedAnimeWeight", "voiceActorsWeight", "staffWeight"
  ];

  const axiosConfig = {
    headers: {
      'ngrok-skip-browser-warning': 'koosa',
    }
  };

  const [weights, setWeights] = useState({
    "nameWeight": 1.0,
    "japaneseNameWeight": 1.0,
    "typeWeight": 1.0,
    "episodesWeight": 1.0,
    "studioWeight": 1.0,
    "releaseSeasonWeight": 1.0,
    "tagsWeight": 1.0,
    "ratingWeight": 1.0,
    "releaseYearWeight": 1.0,
    "descriptionWeight": 1.0,
    "contentWarningWeight": 1.0,
    "relatedMangeWeight": 1.0,
    "relatedAnimeWeight": 1.0,
    "voiceActorsWeight": 1.0,
    "staffWeight": 1.0,
    "isTiny": false,
    "decreases": 3
  });

  const [mode, setMode] = useState("kmeans");
  const [dataset, setDataset] = useState("normal");
  const [inputNumber, setInputNumber] = useState(0);
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null); 

  const modeChange = (event) => {
    setMode(event.target.value);
  };

  const datasetChange = (event) => {
    setDataset(event.target.value);
  };

  const handleNumberChange = (event) => {
    setInputNumber(event.target.value);
  };

  const handleOpen = (anime) => {
    setSelectedShow(anime);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = () =>  {
    weights["isTiny"] = dataset === "reduced";

    let response = null;


    if(mode === "kmeans") {
      let { decreases, ...rest } = weights;

      const kWeights = { ...rest, "k": parseInt(inputNumber) };
      delete kWeights.decreases;
      
      console.log(kWeights);

      axios.post(`${link + 'kmeans'}`, kWeights, axiosConfig)
        .then((response) => {
          if (response.status === 200) {
            console.log('POST Response:');
            console.log(response.data);
            response.data.clusters.sort((a, b) => b.documents.length - a.documents.length);
            setResults(response.data);
          } else {
            console.error('Request failed with status code: ' + response.status);
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });

    } else {
      weights["decreases"] = parseInt(inputNumber);
      console.log(weights)

      axios.post(`${link + 'hierarchical'}`, weights, axiosConfig)
        .then((response) => {
          if (response.status === 200) {
            console.log('POST Response:');
            console.log(response.data);
            response.data.clusters.sort((a, b) => b.documents.length - a.documents.length)
            setResults(response.data);
          } else {
            console.error('Request failed with status code: ' + response.status);
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });

    }

    console.log("Results: ");
    console.log(results);
    console.log("Call done");

  };

  const visualize = (response) => {
    console.log(response);
  };

  const handleWeightChange = (event, key) => {
    if(event.target.value == null) {
      event.target.value = 0;
    }
    setWeights({ ...weights, [key]: parseFloat(event.target.value) });
  };
  

  return (
    <div className="App">
      <div className="title">
        <h1>Epic Anime Clusterer 🔥</h1>
      </div>
      <div className="dataset">
        <h2 style={{ marginBottom: '5px'}} >Dataset</h2>
        <Select value={dataset} onChange={datasetChange}>
          <MenuItem value={"normal"}>Normal</MenuItem>
          <MenuItem value={"reduced"}>Reduced</MenuItem>
        </Select>
      </div>
      
      <div className="mode">
        <h2 style={{ marginBottom: '5px'}} >Mode</h2>
        <Select value={mode} onChange={modeChange}>
          <MenuItem value={"kmeans"}>K-Means</MenuItem>
          <MenuItem value={"hierarchical"}>Hierarchical</MenuItem>
        </Select>

        <TextField
          type="number"
          value={inputNumber}
          onChange={handleNumberChange}
          InputProps={{ inputProps: { min: 0 } }}
          style={{ marginTop: '15px', marginBottom: '15px', width: '120px'}}
          label={mode === "kmeans" ? "Clusters" : "Stopping Criteria"}
        />
        
        
      </div>
      <div className="weightFields" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Grid container spacing={2} justify="center">
          {weightKeys.map((key, index) => (
            <Grid item xs={6} key={index} style={{ width: '200px' }} >
              <TextField
                type="number"
                value={weights[key]}
                onChange={(event) => handleWeightChange(event, key)}
                InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                style={{ width: '100%' }}
                label={key}
              />
            </Grid>
          ))}
        </Grid>
      </div>

      <div className="submitButton">  
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </div>

      {results && (
        <div className="results">
          <center>
            <Typography variant="h4" style={{ margin: 'auto' }} >
              Davies-Bouldin Index: <b>{results.daviesBouldinIndex}</b>
            </Typography>
            <Typography variant="h4">
              Dunn Index: <b>{results.dunnIndex}</b>
            </Typography>
          </center>
          <Table>
            <TableBody>
            {results.clusters.map((cluster, index) => {
              if(cluster.documents.length <= 1) return (<></>);

              let isDown = false;
              let startX;
              let scrollLeft;

              return (
                <TableRow key={index} style={{ borderBottom: '3px solid black' }}>
                  <TableCell>
                    <Typography variant="h3">Cluster {index + 1}</Typography>
                    <div 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'row',
                        overflowX: 'scroll',
                        scrollbarWidth: 'none',
                        whiteSpace: 'nowrap',
                        width: '95vw',
                        userSelect: 'none',
                      }}
                      onMouseDown={(e) => {
                        isDown = true;
                        startX = e.pageX - e.currentTarget.offsetLeft;
                        scrollLeft = e.currentTarget.scrollLeft;
                      }}
                      onMouseLeave={() => {
                        isDown = false;
                      }}
                      onMouseUp={() => {
                        isDown = false;
                      }}
                      onMouseMove={(e) => {
                        if(!isDown) return;
                        e.preventDefault();
                        const x = e.pageX - e.currentTarget.offsetLeft;
                        const walk = (x - startX) * 1.3;
                        e.currentTarget.scrollLeft = scrollLeft - walk;
                      }}
                    >
                      {cluster.documents.map((anime, index) => (
                        <div key={index} style={{ margin: '10px', textAlign: 'center', wordWrap: 'break-word'}}>
                          <img 
                            src={`assets/imgs/${anime.rank}.jpg`} 
                            alt={anime.name} 
                            style={{ borderRadius: '10px', }} 
                            onClick={() => handleOpen(anime)} 
                          />
                          <Typography variant="subtitle1">{anime.name}</Typography>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
          <Modal
              open={open}
              onClose={handleClose}
            >
              <div style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#f5f5f5',
                borderRadius: '10px',
                padding: '20px',
                maxWidth: '90%',
                width: '600px',
                overflow: 'auto',
                maxHeight: '90vh',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
               }}>
                <IconButton style={{ position: 'absolute', right: '10px', top: '10px' }} onClick={handleClose}>
                  <Close />
                </IconButton>
                {selectedShow && (
                  <>
                    <img 
                      src={`assets/imgs/${selectedShow.rank}.jpg`} 
                      alt={selectedShow.name} 
                      style={{ 
                        display: 'block', 
                        marginLeft: 'auto', 
                        marginRight: 'auto',
                        borderRadius: '10px',
                        boxShadow: '0 0 1px rgba(0, 0, 0, 0.1)',
                        maxHeight: '300px'
                      }} />
                    <br />
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Name:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.name}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Rank:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.rank}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Japanese Name:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.japanese_name}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Type:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.type}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Description:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.description}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Episodes:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.episodes}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Studio:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.studio}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Tags:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.tags}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Rating:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.rating}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Release Year:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.release_year}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Related Anime:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.related_anime}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Staff:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.staff}</Typography>
                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#333' }}>Voice Actors:</Typography> <Typography variant="body1" style={{ color: '#333' }}>{selectedShow.voice_actors}</Typography>
                  </>
                )}
              </div>
            </Modal>
        </div>
      )}
    

    </div>
  )
}

export default App;
