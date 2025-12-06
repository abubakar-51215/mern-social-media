import React from 'react';
import './PeopleCard.css'; // Assuming you have a CSS file for styling

const PeopleCard = ({ person }) => {
    return (
        <div className="people-card">
            <img src={person.profilePicture} alt={`${person.name}'s profile`} className="people-card__image" />
            <h3 className="people-card__name">{person.name}</h3>
            <p className="people-card__bio">{person.bio}</p>
            <button className="people-card__connect-button">Connect</button>
        </div>
    );
};

export default PeopleCard;