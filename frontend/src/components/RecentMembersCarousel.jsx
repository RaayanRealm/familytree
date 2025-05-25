import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "react-router-dom";


const RecentMembersCarousel = ({ members }) => {
    if (!members.length) {
        return <p>Loading members...</p>; // ✅ Debugging step
    }

    const settings = {
        dots: true,
        adaptiveHeight: true,
        arrows: true,
        centerMode: true,
        centerPadding: "60px",
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        pauseOnHover: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    centerPadding: "40px",
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    centerPadding: "20px",
                },
            },
        ],
        // Additional settings for infinite scrolling
        dotsClass: "slick-dots slick-dots-custom",
        arrowsClass: "slick-arrows slick-arrows-custom",
        pauseOnFocus: true,
        swipeToSlide: true,
        touchMove: true,
        draggable: true,
        swipe: true,
        infinite: true,
        speed: 500,
    };

    return (
        <Slider {...settings}>
            {members.map((member) => (
                <div key={member.id} className="carousel-card">
                    <Link to={`/member/${member.id}`}> {/* ✅ Wrap image in a link */}
                        <img src={`http://localhost:5000${member.profile_picture}`} alt={member.first_name} />
                    </Link>
                    <div className="carousel-info">
                        <Link to={`/member/${member.id}`}> {/* ✅ Wrap name in a link */}
                            <h3>{member.first_name} {member.last_name}</h3>
                        </Link>
                        <p className="bio">{member.biography}</p>
                    </div>
                </div>
            ))}
        </Slider>
    );
};


export default RecentMembersCarousel;