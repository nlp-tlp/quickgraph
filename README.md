<div style="display:flex;align-items:center;flex-direction:column;justify-content:center">
<img src="quickgraph_logo.png" width="100">
<h2>
QuickGraph: A Rapid Annotation Tool for Knowledge Graph Extraction from Technical Text</h2>
</div>
QuickGraph is a rapid multi-user annotation tool for multi-task information tasks. It is built on the full-stack web-based framework MERN (MongoDB-Express-React-Node). A live demonstration of the tool can be found at https://quickgraph.nlp-tlp.org and a systems demonstration video at https://youtu.be/DTWrR67-nCU.

## Getting started

QuickGraph can be built using Docker. Before doing so please add a secure token to the `TOKEN_SECRET` field in `/server/.env` for user password hashing and salting. After this, in the repository root directory, execute:
```
$ make run
```

or alternatively:
```
$ docker-compose -f docker-compose.yml up
```



## Attribution
Please cite our [[conference paper]](https://arxiv.org/abs/####.#####) (to appear in ACL2022) if you find it useful in your research:
```
  @inproceedings{bikaun2022quickgraph,
      title={QuickGraph: A Rapid Annotation Tool for Knowledge Graph Extraction from Technical Text},
      author={Bikaun, Tyler, Michael Stewart and Liu, Wei},
      pages={x--y},
      year={2022}
}
```

## Feedback
Please email any feedback or questions to Tyler Bikaun (tyler.bikaun@research.uwa.edu.au)
