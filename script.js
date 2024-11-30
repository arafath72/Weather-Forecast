const apiKey='a0af1839caf6ff9c9d0e8c949c38636e'

const cityInput=document.querySelector('.city-input')
const searchBtn=document.querySelector('.search-btn')

const weatherInfoSection=document.querySelector('.weather-info')
const notFoundSection=document.querySelector('.not-found')
const searchCitySection=document.querySelector('.search-city')

const countrytxt=document.querySelector('.country')
const temptxt=document.querySelector('.temp')
const conditiontxt=document.querySelector('.condition')
const humiditytxt=document.querySelector('.humidity-value')
const windtxt=document.querySelector('.wind-value')
const weatherDetailsImg=document.querySelector('.weather-details-img')
const currentDatetxt=document.querySelector('.current-date')
const currentTimetxt=document.querySelector('.current-time')

const forecastDetails=document.querySelector('.forecast-details')

searchBtn.addEventListener('click',()=>{
    if(cityInput.value.trim()!=''){
        updateWeatherInfo(cityInput.value)
        cityInput.value=''
        cityInput.blur()
    }
})

cityInput.addEventListener('keydown',(event)=>{
    if(event.key =='Enter' && 
        cityInput.value.trim()!=''
    )   {
        updateWeatherInfo(cityInput.value)
        cityInput.value=''
        cityInput.blur() 
    }
})

async function getCityCoodinates(city){
    const apiUrl=`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    const response=await fetch(apiUrl)
    const data=await response.json()

    if(data.cod !== 200) throw new Error(data.message||'City not found')
        return{
            lat: data.coord.lat,
            lon: data.coord.lon,
            name: data.name,
            country: data.sys.country,
            main: data.main,
            weather: data.weather,
            wind: data.wind,
            timezone: data.timezone
        }
}

async function getOneCallData(lat,lon){
    const apiUrl=`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`
    try{
        const response=await fetch(apiUrl)
        if(!response.ok){
            throw new Error(`Failed to fetch forecast data:${response.statusText}`)
        }
        const data=await response.json()
        console.log('One Call API Response:',data)
        return data
    }
    catch(error){
        console.error('getOnceCallData Error:',error.message)
        throw error
    }
}

function getWeatherIcon(id){
    if(id<=232) return 'thunderstorm.png'
    if(id<=321) return 'drizzle.png'
    if(id<=531) return 'rain.png' 
    if(id<=622) return 'snow.png'
    if(id<=781) return 'atmosphere.png'
    if(id<=800) return 'clearsky.png'
    else return 'clouds.png' 
 }

 let timezoneOffset=0;

 function getLocalTime(offsetInSeconds){
     const now=new Date()
     const utc=now.getTime()+now.getTimezoneOffset()*60000
     const localTime=new Date(utc+offsetInSeconds*1000)
     return localTime.toLocaleTimeString('en-GB',{
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit',
         hour12: true
     })
 }
 
 function updateLocalTime() {
     if (timezoneOffset !== 0){
         currentTimetxt.textContent=getLocalTime(timezoneOffset)
     }
 }

function getCurrentDate(){
    const currentDate=new Date()
    const options={
        weekday:'short',
        day:'2-digit',
        month: 'short'
    }
    return currentDate.toLocaleDateString('en-GB',options)
 }

async function updateWeatherInfo(city){
    try{
        const{
            lat,
            lon,
            name,
            country,
            main:{temp,humidity},
            weather:[{id,main}],
            wind:{speed},
            timezone
        }=await getCityCoodinates(city)

        countrytxt.textContent=`${name},${country}`
        temptxt.textContent=Math.round(temp)+'°C'
        conditiontxt.textContent=main
        humiditytxt.textContent=humidity+'%'
        windtxt.textContent=speed+' m/s'
        timezoneOffset=timezone
    
        currentDatetxt.textContent=getCurrentDate()
        weatherDetailsImg.src=`icons/${getWeatherIcon(id)}`

        const forecastData=await getOneCallData(lat,lon)

        if(forecastData.daily){
            updateForecastsInfo(forecastData.daily)
        }
        else{
            console.error('No daily forecast data found')
        }
        
        showDisplaySection(weatherInfoSection)

        setInterval(updateLocalTime,1000);
        updateLocalTime()
    }
    catch(error){
        console.error('updateWeatherInfo Error:',error.message)
        showDisplaySection(notFoundSection)
    }
}

function updateForecastsInfo(dailyForecasts){
    if(!Array.isArray(dailyForecasts)){
        console.error('Invalid daily forecast data:',dailyForecasts)
        return
    }
    forecastDetails.innerHTML=''

    dailyForecasts.slice(1,8).forEach((day)=>{
        const date=new Date(day.dt*1000)
        const dateOptions={
            day:'2-digit',month:'short'
        }
        const dateResult=date.toLocaleDateString('en-US',dateOptions)

        const forecastItem=`<div class="forecast-item">
            <h5 class="forecast-item-date regular-text">${dateResult}</h5>
            <img src="icons/${getWeatherIcon(day.weather[0].id)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(day.temp.day)}°C</h5>
        </div>`
        forecastDetails.insertAdjacentHTML('beforeend',forecastItem)
    })
}

function showDisplaySection(section){
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(section => section.style.display='none')
    section.style.display='grid'
}