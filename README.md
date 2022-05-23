<div style="display:flex;align-items:center;flex-direction:column;justify-content:center">
<img src="quickgraph_logo.png" width="100">
<h2>
QuickGraph: A Rapid Annotation Tool for Knowledge Graph Extraction from Technical Text</h2>
</div>
QuickGraph is a collaborative annotation tool for rapid multi-task information extraction. Key features of QuickGraph include entity and relation propagation which mimics weak supervision, and the use of text clustering to aid with annotation consistency. <br/><br/>

  🖥 [Try out QuickGraph online](https://quickgraph.nlp-tlp.org)<br/>
  🎥 [QuickGraph systems demonstration video](https://youtu.be/DTWrR67-nCU)<br/>
  📌 [Overview of how to use QuickGraph](https://github.com/nlp-tlp/quickgraph/blob/main/About.md)<br/>
  📌 [Frequently Asked Questions (FAQ)](https://github.com/nlp-tlp/quickgraph/blob/main/FAQ.md)<br/>
  📨 Feel free to reach out if you have any questions by emailing tyler.bikaun@research.uwa.edu.au<br/>

Note: the Overview and FAQ are still being completed so please be patient 🙂

## Getting started

QuickGraph can be built using Docker. Before doing so please add a secure token to the `TOKEN_SECRET` field in `/server/.env` for user password hashing and salting. After this, in the repository root directory, execute:

```
$ make run
```

or alternatively:

```
$ docker-compose -f docker-compose.yml up
```

## Issues, Bugs and Feedback
QuickGraph is currently under active development with only a single developer, so bugs are still being squashed. If you come across any issues, bugs or have any general feedback please feel free to reach out (email: tyler.bikaun@research.uwa.edu.au). Alternatively, feel free to raise an issue, or better yet, make a pull request 🙂.

### Known Issues/Bugs
Annotation with QuickGraph under entity annotation, and entity and closed relation annotation has been widely tested for single users, however a few bugs still exist in the multi-user environment and for open relation annotation. The following are currently being resolved:
- [ ] Download summary for multiple users not showing correct summaries for each user reliably
- [ ] Inter-annotator agreement not aggregating reliably
- [x] ~~Plots for open relation annotation do not work~~
- [ ] Graph performance for thousands of nodes/edges is not optimal
- [ ] Contiguous token selection for pages with massive numbers of tokens is slow
- [ ] Relation badges when accepting all suggested relations look similar to those that are accepted

## Future features
- [ ] Allow relation propagation for open relation annotation
- [ ] Plots in dashboard overview to be improved to include distribution of entities, relations and triples created by each user rather than aggregating over all users
- [ ] Improved document distribution method(s)
- [ ] Extend open relation extraction for multi-user environments
- [ ] Allow ontologies to be dynamically modified (CRUD, colour scheme, descriptions, etc.)
- [ ] Permit projects to be inititated from QuickGraph download artifacts
- [ ] Add option for downloading triples and entities together
- [ ] Improve graph performance, interaction and filtering capabilities
- [ ] Enhanced identification of suggested relations
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
