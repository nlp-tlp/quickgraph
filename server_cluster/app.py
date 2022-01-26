'''
    API for rank order clustering documents.
'''

import itertools
import pathlib
from collections import Counter, defaultdict
from enum import Enum
from typing import List, Optional

import numpy as np
import uvicorn
from fastapi import Body, FastAPI, HTTPException
from loguru import logger
from nltk import FreqDist
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering, KMeans
from sklearn.decomposition import LatentDirichletAllocation

log_path = pathlib.Path(__file__).parent.resolve()


logger.add(
    f"{log_path}/api.log", rotation="10 MB")

app = FastAPI()

# Load SBERT model
logger.info(f'Loading model')
model_checkpoint = 'all-distilroberta-v1'
model = SentenceTransformer(model_checkpoint)
logger.info(f'{model_checkpoint} loaded')


@app.get("/ping")
def ping_pong():
    ''' Checks API service '''
    return {"message": "pong"}


class Data(BaseModel):
    corpus: List[str]


@app.post("/rank_cluster")
def rank_cluster(data: Data):
    '''

    '''

    logger.info(
        "Performing rank order clustering with SentBERT and Agglomerative clustering")
    logger.info(f'Corpus size: {len(data.corpus)}')

    # Embed sentences
    logger.info(f'Corpus embedding started')
    corpus_embeddings = model.encode(
        data.corpus, batch_size=64)  # show_progress_bar=False, convert_to_tensor=True
    logger.info(f'Corpus embedding finished')

    logger.info(f'Clustering started')
    logger.info('Transforming embedding for agglomerative clustering')
    # Normalize the embeddings to unit length
    corpus_embeddings = corpus_embeddings / \
        np.linalg.norm(corpus_embeddings, axis=1, keepdims=True)

    # , affinity='cosine', linkage='average', distance_threshold=0.4)
    clustering_model = AgglomerativeClustering(
        n_clusters=None, distance_threshold=1.5)

    clustering_model.fit(corpus_embeddings)
    logger.info('fitted cluster model')

    cluster_assignment = clustering_model.labels_
    # logger.debug(cluster_assignment)
    logger.info(f'Clustering finished')

    clustered_corpus = []
    for sentence_id, cluster_id in enumerate(cluster_assignment):
        # print(sentence_id, cluster_id)
        clustered_corpus.append({"id": int(sentence_id), "cluster": int(
            cluster_id), "sentence": data.corpus[sentence_id]})

    # Get human-interpretable label for cluster
    groups = defaultdict(list)

    # Group clusters into arrays
    for obj in clustered_corpus:
        groups[obj["cluster"]].append(obj)

    # Find topn terms in clusters
    cluster_terms = {}
    for cluster in groups.values():
        cluster_number = cluster[0]['cluster']

        cluster_tokens = list(itertools.chain(
            *[text['sentence'].split() for text in cluster]))

        token_freq_dist = FreqDist(cluster_tokens)
        top_n_terms = token_freq_dist.most_common(5)
        top_n_term_string = "|".join([term for term, _ in top_n_terms])
        cluster_terms[cluster_number] = top_n_term_string

    # Get cluster counts / distribution
    cluster_distribution = Counter(
        sentence['cluster'] for sentence in clustered_corpus)
    # print(cluster_distribution)

    cluster_details = [{"cluster_number": cluster_no, 'count': cluster_distribution[cluster_no],
                        'top_n_terms': cluster_terms[cluster_no]} for cluster_no in cluster_distribution.keys()]

    cluster_details_sorted = sorted(
        cluster_details, key=lambda d: d['cluster_number'])

    return {'clustered_corpus': clustered_corpus, 'cluster_details': cluster_details_sorted}


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
