import React from 'react';
import './App.css';

const oWords = shuffle(require("./words.json"));
// const oDefinitions = shuffle();

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
class Answer extends React.Component {
  constructor(props) {
    super();
    this.state = {
      word: props.word,
      answered: props.answered,
    }
  }
  componentWillReceiveProps(nextProps){
    if(this.props !== nextProps){
      this.setState({
        answered:nextProps.answered,
        word:nextProps.word,
      });
    }
  }

  render() {
    return (
      <h3 className="answer">{this.state.answered ? this.state.word.answer : this.state.word.sentence}</h3>
    )
  }
}

class Definition extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      oDefinition: null,
      elements:null,
    }
    this.APIcall(this.props.verb);
  }
  componentWillReceiveProps(nextProps){
    if(this.props !== nextProps){
      this.APIcall(nextProps.verb);
    }
  }

  APIcall = (word) => {
    const searchTerm = encodeURI(word);
    const uri = `https://api.datamuse.com/words?sl=${searchTerm}&md=p,d&max=5`;
    let jsonResponse;
    let request = new XMLHttpRequest();
    request.open("GET",uri,true);

    request.onload = () => {
      try {
        jsonResponse = JSON.parse(request.responseText);
      } catch(e) {
        console.log(e);
      }
      const definitionElements = this.showDefinition(jsonResponse);
      this.setState({
        oDefinition:jsonResponse,
        elements:definitionElements,
      });
    };
    request.send();
  }

  showDefinition = (defs) => {
    let elList = [];
    try {
      let index;
      for (let i = 0; i < defs.length; i++){
        if (defs[i].tags[0] === "v"){
          index = i;
          break
        }
      }
      defs[index].defs.forEach((d,key) => {
        elList.push(
          <div className="definition-text" key={key}>{d.slice(2)}</div>
        );
      });
    } catch(e) {
      console.log(e);
    }
    return elList;
  }

  render() {
    return (

      <div className="Definition">
        <div className="definition-title">Definitions</div>
        {this.state.elements}
      </div>
    )
  }
}

class Option extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      word: props.word,
      answered:false,
      alreadyAnswered:props.alreadyAnswered,
    }
  }
  componentWillReceiveProps(nextProps){

    if(this.props !== nextProps){
      if(nextProps.nextWord){
        this.setState({
          alreadyAnswered:nextProps.alreadyAnswered,
          answered:nextProps.answered,
          word:nextProps.word,
        });
      } else {
        this.setState({
          alreadyAnswered:nextProps.alreadyAnswered,
          //answered:nextProps.answered,
        });
      }
    }
  }

  createClassNames = () => {
    let classNames = this.state.answered === "correct" ? "Option answered" : this.state.answered === "wrong" ? "Option wrong": "Option";
    if (!this.state.alreadyAnswered) classNames += " highlight";
    return classNames;
  }

  onClick = () => {
    this.props.makeNextWordFalse(); //stops the words from updating with every setState
    if (this.state.alreadyAnswered) return;
    const id = this.state.word.id;
    if(this.props.checkSelection(id)){
      this.props.findVerbForms(this.state.word.verb.split(" ")[0]);
      this.setState({answered:"correct"});
    } else {
      this.setState({answered:"wrong"});
    }
  }
  render() {
    return (
      <div className={this.createClassNames()} onClick={this.onClick}>
        <span className="option-text">{this.state.word.verb}</span>
      </div>
    )
  }
}

class VerbForms extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      obj: props.obj,
      verb:props.verb,
    }
  }
  componentWillReceiveProps(nextProps){
    if(this.props !== nextProps){
      this.setState({
        obj:nextProps.obj,
        verb:nextProps.verb,
      })
    }
  }

  getParticle = () => {
    const verbArray = this.state.verb.split(" ");
    return " " + verbArray.slice(1).join(" ")

  }
  onClick = (e) => {
    const verb = e.currentTarget.id;

    this.props.checkVerbForm(verb);
  }

  render() {
    return(
      <div className="VerbForms">
        <div className="verb-forms-title">CHOOSE THE CORRECT VERB FORM</div>
        <div className="verb-forms-choice" id={this.state.obj.infinitive} onClick={this.onClick}>{this.state.obj.infinitive + this.getParticle()}</div>
        <div className="verb-forms-choice" id={this.state.obj.present} onClick={this.onClick}>{this.state.obj.present + this.getParticle()}</div>
        <div className="verb-forms-choice" id={this.state.obj.past} onClick={this.onClick}>{this.state.obj.past + this.getParticle()}</div>
        <div className="verb-forms-choice" id={this.state.obj.pastPart} onClick={this.onClick}>{this.state.obj.pastPart + this.getParticle()}</div>
        <div className="verb-forms-choice" id={this.state.obj.gerund} onClick={this.onClick}>{this.state.obj.gerund + this.getParticle()}</div>
      </div>
    )
  }
}

class ControlPanel extends React.Component {
  onClick = () => {
    this.props.showNextQuestion();
  }
  render () {
    return (
      <div className="ControlPanel">
        <div className="next-question-btn" onClick={this.onClick}>Next question</div>
      </div>
    )
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      allWords:oWords,
      definitions:require("./definitions.json"),
      verbForms:require("./verbForms.json"),
      nextWord:false,
      showDefinition:false,
      showVerbForms:false,
      showControlPanel:false,
      questionAnswered:false,
      verbFormChoices:null,
      words:shuffle(oWords).slice(0,4),
      alreadyAnswered:false,
    }
  }

  checkSelection = (id) => {
    this.setState({
      alreadyAnswered:true,
      showDefinition:true,
    });
    if (id === this.state.words[0].id) {
      return true;
    }
    this.setState({
      showControlPanel:true,
      questionAnswered:true,
    })
    return false;

  }

  checkVerbForm = (selectedVerb) => {
    const sentence = this.state.words[0].answer;
    if (~sentence.toLowerCase().indexOf(`${selectedVerb} `))
    {
      this.setState({
        showControlPanel:true,
        questionAnswered:true,
      })
    } else {
      alert("wrong");
      this.setState({
        showControlPanel:true,
        questionAnswered:true,
      })
    }
  }

  createOptions = () => {
    let elArray = [];
    this.state.words.forEach((w) => {
      const el = <Option
          makeNextWordFalse={this.makeNextWordFalse}
          alreadyAnswered={this.state.alreadyAnswered}
          nextWord={this.state.nextWord}
          questionAnswered={this.state.questionAnswered}
          checkSelection={this.checkSelection}
          word={w}
          findVerbForms={this.findVerbForms}
        />
      elArray.push(el);
    });
    return shuffle(elArray);
  }
  findDefinition = () => {
    const verb = this.state.words[0].verb;
    return this.state.definitions[verb];
  }

  findVerbForms = (verb) => {
    if (verb in this.state.verbForms) {
      this.setState({
        showVerbForms:true,
        verbFormChoices:this.state.verbForms[verb],
      })
    }
    console.log(`${verb} is not in verbForms list`);
  }

  makeNextWordFalse = () => {
    if (this.state.nextWord) {
      this.setState({nextWord:false});
    }
  }

  showNextQuestion = () => {
    this.setState({
      showDefinition:false,
      showVerbForms:false,
      showControlPanel:false,
      questionAnswered:false,
      verbFormChoices:null,
      words:shuffle(oWords).slice(0,4),
      alreadyAnswered:false,
      nextWord:true,
    })
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="title">Multiple Choice</h1>
        </header>
        <div className={"box control-panel-box"}>
          {this.state.showControlPanel ? <ControlPanel showNextQuestion={this.showNextQuestion}/>:""  }
        </div>
        <Answer word={this.state.words[0]} answered={this.state.questionAnswered} />
        <div className="options-box">
          {this.createOptions()}
        </div>
        <div className={"box verb-forms-box"}>
          {this.state.showVerbForms ? <VerbForms
            obj={this.state.verbFormChoices}
            verb={this.state.words[0].verb}
            checkVerbForm={this.checkVerbForm}
            />:""}
        </div>
        <div className={"box definitions-box"}>
          {this.state.showDefinition ? <Definition obj={this.findDefinition()} verb={this.state.words[0].verb} />:""  }
        </div>



      </div>
    );
  }
}

export default App;
