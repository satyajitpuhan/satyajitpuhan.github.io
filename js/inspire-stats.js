document.addEventListener("DOMContentLoaded", function () {
    const inspireId = "Satyajit.Puhan.1";
    const apiUrl = `https://inspirehep.net/api/literature?sort=mostrecent&size=250&q=a%20${inspireId}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const hits = data.hits.hits;

            let totalCitations = 0;
            const citationsArray = [];
            const yearCounts = {};

            hits.forEach(paper => {
                const metadata = paper.metadata;

                // Citation counts
                const cites = metadata.citation_count || 0;
                totalCitations += cites;
                if (cites > 0) citationsArray.push(cites);

                // Publication Year Extraction
                let year = "Unknown";
                if (metadata.publication_info && metadata.publication_info.length > 0 && metadata.publication_info[0].year) {
                    year = metadata.publication_info[0].year.toString();
                } else if (metadata.earliest_date) {
                    year = metadata.earliest_date.substring(0, 4);
                }

                if (year !== "Unknown") {
                    if (!yearCounts[year]) {
                        yearCounts[year] = { article: 0, conference: 0 };
                    }

                    const docType = metadata.document_type || [];
                    if (docType.includes("conference paper")) {
                        yearCounts[year].conference += 1;
                    } else if (docType.includes("article")) {
                        // Includes published and arxiv preprints
                        yearCounts[year].article += 1;
                    }
                }
            });

            // Calculate h-index
            citationsArray.sort((a, b) => b - a);
            let hIndex = 0;
            for (let i = 0; i < citationsArray.length; i++) {
                if (citationsArray[i] >= i + 1) {
                    hIndex = i + 1;
                } else {
                    break;
                }
            }

            // Update DOM with stats
            const statsHtml = `
                <div class="row text-center mt-3">
                    <div class="col-md-4">
                        <h4 style="color: #1e285a; font-weight: 700; font-size: 32px;">${hits.length}</h4>
                        <p style="color: #666; font-size: 14px; text-transform: uppercase;">Total Papers</p>
                    </div>
                    <div class="col-md-4">
                        <h4 style="color: #1e285a; font-weight: 700; font-size: 32px;">${totalCitations}</h4>
                        <p style="color: #666; font-size: 14px; text-transform: uppercase;">Total Citations</p>
                    </div>
                    <div class="col-md-4">
                        <h4 style="color: #1e285a; font-weight: 700; font-size: 32px;">${hIndex}</h4>
                        <p style="color: #666; font-size: 14px; text-transform: uppercase;">h-index</p>
                    </div>
                </div>
            `;
            document.getElementById('inspire-stats-container').innerHTML = statsHtml;

            // Prepare Data for Chart
            const sortedYears = Object.keys(yearCounts).sort();
            const articlesData = sortedYears.map(y => yearCounts[y].article);
            const conferenceData = sortedYears.map(y => yearCounts[y].conference);

            const ctx = document.getElementById('papersChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedYears,
                    datasets: [
                        {
                            label: 'Published Articles',
                            backgroundColor: '#5d78ff',
                            data: articlesData
                        },
                        {
                            label: 'Conference Papers',
                            backgroundColor: '#ffb822',
                            data: conferenceData
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Year-wise Papers & Conference Proceedings', font: { size: 16 } }
                    }
                }
            });
        })
        .catch(err => {
            console.error('Error fetching Inspire HEP data', err);
            document.getElementById('inspire-stats-container').innerHTML = '<p class="text-danger">Failed to load statistics from INSPIRE-HEP.</p>';
        });
});
