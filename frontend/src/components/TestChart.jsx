import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const generateOptions = (title) => {

  return {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
        beginAtZero: true,
        },
        y: {
        ticks: {
            callback: function(value, index) {
            const label = this.getLabelForValue(value);
            return label.length > 15 ? label.substring(0, 12) + '...' : label;
            },
            autoSkip: false,
            maxRotation: 0, 
            minRotation: 0,
            padding: 10, 
        }
    }
    },
    plugins: {
        legend: { position: 'top' },
        labels: {
            padding: 100
        },
        title: {
        display: true,
        text: `${title}`,
        },
    },
  };


}

export const options_freq = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      
      ticks: {
        callback: (value) => Math.abs(value),
      }
    },
    y: {
      stacked: true,
      ticks: { autoSkip: false }
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          return `${label}: ${Math.abs(context.raw)}`;
        }
      }
    },
    title: {
      display: true,
      text: 'Additions vs Deletions Per Repo',
    },
  }
};


const metricColors = {
  commits: { r: 54, g: 162, b: 235 }, 
  prs: { r: 255, g: 99, b: 132 },     
  merges: { r: 75, g: 192, b: 192 },  
  issues: { r: 255, g: 159, b: 64 },  
};

const generateChartData = (obj, metric) => {
  const labels = Object.keys(obj);
  const dataValues = labels.map(key => obj[key][metric]);
  const color = metricColors[metric];

  return {
    labels: labels,
    datasets: [{
      label: `Total ${metric.toUpperCase()}`,
      data: dataValues,
      minBarLength: 0,
      backgroundColor: labels.map(() => `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`),
      borderColor: labels.map(() => `rgba(${color.r}, ${color.g}, ${color.b}, 1)`),
      borderWidth: 1,
      barPercentage: 0.7,
    }]
  };
};

const generateStacked = (obj) => {

    const labels = Object.keys(obj)
    const commit_data = labels.map(key => obj[key]['commits'])
    const pr_data = labels.map(key => obj[key]['prs'])
    const merge_data = labels.map(key => obj[key]['merges'])
    const issues_data = labels.map(key => obj[key]['issues'])


    const colorC = metricColors['commits'];
    const colorP = metricColors['prs']
    const colorM = metricColors['merges']
    const colorI = metricColors['issues']

    return {
        labels: labels,
        datasets: [
        {
            label: 'Total COMMITS',
            data: commit_data,
            minBarLength: 0,
            backgroundColor: labels.map(() => `rgba(${colorC.r}, ${colorC.g}, ${colorC.b}, 0.5)`),
            borderColor: labels.map(() => `rgba(${colorC.r}, ${colorC.g}, ${colorC.b}, 1)`),
            borderWidth: 1,
            barPercentage: 0.7,
        },
        {
            label: 'Total PRS',
            data: pr_data,
            minBarLength: 0,
            backgroundColor: labels.map(() => `rgba(${colorP.r}, ${colorP.g}, ${colorP.b}, 0.5)`),
            borderColor: labels.map(() => `rgba(${colorP.r}, ${colorP.g}, ${colorP.b}, 1)`),
            borderWidth: 1,
            barPercentage: 0.7,
        },
        {
            label: 'Total ISSUES',
            data: issues_data,
            minBarLength: 0,
            backgroundColor: labels.map(() => `rgba(${colorI.r}, ${colorI.g}, ${colorI.b}, 0.5)`),
            borderColor: labels.map(() => `rgba(${colorI.r}, ${colorI.g}, ${colorI.b}, 1)`),
            borderWidth: 1,
            barPercentage: 0.7,
        },
        {
            label: 'Total MERGES',
            data: merge_data,
            minBarLength: 0,
            backgroundColor: labels.map(() => `rgba(${colorM.r}, ${colorM.g}, ${colorM.b}, 0.5)`),
            borderColor: labels.map(() => `rgba(${colorM.r}, ${colorM.g}, ${colorM.b}, 1)`),
            borderWidth: 1,
            barPercentage: 0.7,
        }
        ]
    };


};


const generateFreqData = (obj_freq) => {
  const freq_labels = Object.keys(obj_freq);
  const freq_additions = freq_labels.map(key => obj_freq[key][0]);
  const freq_deletions = freq_labels.map(key => -obj_freq[key][1]);

  return {
    labels: freq_labels,
    datasets: [
      {
        label: 'Additions',
        data: freq_additions,
        minBarLength: 0,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        barPercentage: 0.7
      },
      {
        label: 'Deletions',
        data: freq_deletions,
        minBarLength: 0,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        barPercentage: 0.7
      }
    ]
  };
};


const commit_op = generateOptions('Commits Per Repo')
const pr_op = generateOptions('PRs Per Repo')
const merge_op = generateOptions('Merges Per Repo')
const issues_op = generateOptions('Issues Per Repo')
const combined_op = generateOptions('Stacked Bar Per Repo For Each Stat')


export default function TestChart({ statsData, freqData }) {
  if (!statsData || !freqData) {
    return null;
  }

  const commitData = generateChartData(statsData, 'commits');
  const prData = generateChartData(statsData, 'prs');
  const merges = generateChartData(statsData, 'merges');
  const issues = generateChartData(statsData, 'issues');
  const combined = generateStacked(statsData);
  const data_freq = generateFreqData(freqData);

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <div style={{ height: '500px', marginBottom: '40px' }}>
        <Bar options={commit_op} data={commitData} />
      </div>
      <div style={{ height: '500px', marginBottom: '40px' }}>
        <Bar options={pr_op} data={prData} />
      </div>
      <div style={{ height: '500px', marginBottom: '40px' }}>
        <Bar options={merge_op} data={merges} />
      </div>
      <div style={{ height: '500px', marginBottom: '40px' }}>
        <Bar options={issues_op} data={issues} />
      </div>
      <div style={{ height: '500px', marginBottom: '40px' }}>
        <Bar options={combined_op} data={combined} />
      </div>
      <div style={{ height: '500px', marginBottom: '40px' }}>
        <Bar options={options_freq} data={data_freq} />
      </div>
    </div>
  );
}
